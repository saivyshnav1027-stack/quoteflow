import React, { useState, useMemo } from 'react'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import type { Product, PricingSuperiorityMode } from '../../types'
import {
  type RawImportRow,
  type ValidatedImportRow,
  type PricingCalculationMode,
  validateImportRow,
  chunkArray,
} from '../../lib/catalogImport'
import { downloadCatalogTemplate } from '../../lib/excelTemplate'
import { BulkUploadProgressModal } from './BulkUploadProgressModal'

export interface BulkUploadModalProps {
  isOpen: boolean
  existingProducts: Product[]
  defaultSuperiorityMode?: PricingSuperiorityMode
  onClose: () => void
  onSuccess: () => Promise<void>
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  existingProducts,
  defaultSuperiorityMode = 'PRICE',
  onClose,
  onSuccess,
}) => {
  const [calculationMode, setCalculationMode] = useState<PricingCalculationMode>(
    defaultSuperiorityMode === 'PERCENTAGE' ? 'MODE_B' : 'MODE_A'
  )
  const [rawRows, setRawRows] = useState<RawImportRow[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [parseError, setParseError] = useState<string>('')

  // Progress state
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentBatch, setCurrentBatch] = useState(1)
  const [totalBatches, setTotalBatches] = useState(1)
  const [processedCount, setProcessedCount] = useState(0)
  const [estimatedSecondsLeft, setEstimatedSecondsLeft] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [batchError, setBatchError] = useState<string>('')

  // Build existing SKU set for quick lookup
  const existingSkuSet = useMemo(() => {
    const set = new Set<string>()
    existingProducts.forEach((p) => {
      if (p.product_code) {
        set.add(p.product_code.trim().toUpperCase())
      }
    })
    return set
  }, [existingProducts])

  // Validate all raw rows whenever rawRows or calculationMode changes
  const validatedRows: ValidatedImportRow[] = useMemo(() => {
    return rawRows.map((r) => validateImportRow(r, existingSkuSet, calculationMode))
  }, [rawRows, existingSkuSet, calculationMode])

  const validRows = useMemo(
    () => validatedRows.filter((r) => r.status === 'valid'),
    [validatedRows]
  )

  const newCount = useMemo(
    () => validRows.filter((r) => !r.isUpdate).length,
    [validRows]
  )

  const updateCount = useMemo(
    () => validRows.filter((r) => r.isUpdate).length,
    [validRows]
  )

  const invalidCount = useMemo(
    () => validatedRows.filter((r) => r.status === 'invalid').length,
    [validatedRows]
  )

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('')
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result
        if (!buffer) return

        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Parse to JSON array of objects
        const rawJson: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
        })

        if (!rawJson || rawJson.length === 0) {
          setParseError('The uploaded file contains no data rows.')
          setRawRows([])
          return
        }

        // Map heterogeneous headers to standardized keys
        const mappedRows: RawImportRow[] = rawJson.map((row) => {
          const keys = Object.keys(row)
          const findVal = (patterns: string[]): any => {
            const matchedKey = keys.find((k) => {
              const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '')
              return patterns.some((p) => cleanKey === p || cleanKey.includes(p))
            })
            return matchedKey ? row[matchedKey] : undefined
          }

          const productCode = findVal(['productcode', 'code', 'sku', 'itemcode', 'itemno'])
          const productName = findVal([
            'productname',
            'name',
            'description',
            'descriptionofgoods',
            'itemname',
            'title',
          ])
          const unit = findVal(['unit', 'uom', 'measure'])
          const listPrice = findVal(['listprice', 'list', 'mrp'])
          const discountPercentage = findVal(['tradediscount', 'discount', 'td', 'tradedisc'])
          const costPrice = findVal(['costprice', 'cost', 'purchaseprice', 'cp', 'rate'])
          const marginPercentage = findVal(['marginpercentage', 'margin', 'markup'])
          const netPrice = findVal(['netprice', 'net', 'sellingprice', 'sp', 'netrate', 'netamount'])

          return {
            productCode: productCode !== undefined ? String(productCode).trim() : '',
            productName: productName !== undefined ? String(productName).trim() : '',
            unit: unit !== undefined ? String(unit).trim() : 'Pcs.',
            listPrice,
            discountPercentage,
            costPrice,
            marginPercentage,
            netPrice,
          }
        })

        setRawRows(mappedRows)
      } catch (err) {
        console.error('File parsing error:', err)
        setParseError('Failed to read Excel/CSV file. Please ensure it is a valid format.')
        setRawRows([])
      }
    }

    reader.readAsArrayBuffer(file)
  }

  const handleStartImport = async () => {
    if (validRows.length === 0) return

    setIsProcessing(true)
    setIsComplete(false)
    setBatchError('')

    const chunks = chunkArray(validRows, 100)
    setTotalBatches(chunks.length)
    setCurrentBatch(1)
    setProcessedCount(0)

    const startTime = Date.now()
    let completedItems = 0

    try {
      for (let i = 0; i < chunks.length; i++) {
        setCurrentBatch(i + 1)
        const chunk = chunks[i]

        // Calculate dynamic ETA based on elapsed time per batch
        const elapsedMs = Date.now() - startTime
        const avgMsPerBatch = i > 0 ? elapsedMs / i : 1200
        const remBatches = chunks.length - i
        setEstimatedSecondsLeft(Math.max(1, (remBatches * avgMsPerBatch) / 1000))

        const res = await fetch('/api/products?action=bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'bulk',
            items: chunk,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.message || `Failed to upload batch ${i + 1}`)
        }

        completedItems += chunk.length
        setProcessedCount(completedItems)
      }

      setIsComplete(true)
      await onSuccess()
    } catch (err: any) {
      console.error('Bulk import error:', err)
      setBatchError(err.message || 'An error occurred during batch ingestion.')
    }
  }

  const handleFinishModal = () => {
    setIsProcessing(false)
    setIsComplete(false)
    setRawRows([])
    setFileName('')
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Bulk Product Catalog Upload
                </h2>
                <p className="text-xs text-slate-500">
                  Import supplier spreadsheets (.xlsx, .xls, .csv) with auto-calculation & 100-item batching
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Calculation Engine Mode Selector */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Pricing Calculation Priority Mode
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCatalogTemplate()}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Blank Template (.xlsx)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <label
                  onClick={() => setCalculationMode('MODE_A')}
                  className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    calculationMode === 'MODE_A'
                      ? 'border-blue-600 bg-white shadow-sm ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="pricingMode"
                    checked={calculationMode === 'MODE_A'}
                    onChange={() => setCalculationMode('MODE_A')}
                    className="mt-0.5 text-blue-600 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      Mode A: Rupee Amounts Superior (Recommended)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      <b>Cost Price (₹) & Net Price (₹)</b> are sacred. Automatically calculates Trade Discount % and Margin % without penny roundoff shifts.
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setCalculationMode('MODE_B')}
                  className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    calculationMode === 'MODE_B'
                      ? 'border-blue-600 bg-white shadow-sm ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="pricingMode"
                    checked={calculationMode === 'MODE_B'}
                    onChange={() => setCalculationMode('MODE_B')}
                    className="mt-0.5 text-blue-600 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      Mode B: Percentages Superior
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      <b>Trade Discount % & Margin %</b> are sacred. Automatically derives Cost Price and Net Price from List Price.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500/80 rounded-2xl p-6 text-center transition-all bg-slate-50/50 hover:bg-blue-50/10">
              <input
                type="file"
                id="catalog-file-input"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="catalog-file-input"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {fileName ? (
                    <span className="text-blue-700">{fileName}</span>
                  ) : (
                    'Click to select or drag & drop Supplier Spreadsheet'
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)
                </div>
              </label>
            </div>

            {/* Errors if any */}
            {parseError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Ingestion Preview & Summary */}
            {validatedRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800">Import Preview</span>
                    <span className="text-xs text-slate-500">
                      ({validatedRows.length} total rows parsed)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {newCount} New Products
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold">
                      {updateCount} Existing Updates
                    </span>
                    {invalidCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold">
                        {invalidCount} Invalid Rows
                      </span>
                    )}
                  </div>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100 sticky top-0 text-slate-700 font-bold z-10">
                      <tr>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Code / SKU</th>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-3">Unit</th>
                        <th className="py-2 px-3 text-right">List (₹)</th>
                        <th className="py-2 px-3 text-right">Dis %</th>
                        <th className="py-2 px-3 text-right">Cost (₹)</th>
                        <th className="py-2 px-3 text-right">Margin %</th>
                        <th className="py-2 px-3 text-right">Net Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {validatedRows.slice(0, 50).map((row, idx) => (
                        <tr
                          key={idx}
                          className={
                            row.status === 'invalid'
                              ? 'bg-rose-50/50'
                              : row.isUpdate
                              ? 'bg-blue-50/20'
                              : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-1.5 px-3 whitespace-nowrap">
                            {row.status === 'invalid' ? (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700"
                                title={row.errors.join(', ')}
                              >
                                Error
                              </span>
                            ) : row.isUpdate ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                Update
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                New
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {row.productCode || (
                              <span className="text-slate-400 italic">Auto</span>
                            )}
                          </td>
                          <td className="py-1.5 px-3 font-medium text-slate-900 max-w-xs truncate">
                            {row.productName || (
                              <span className="text-rose-500 font-bold">Missing</span>
                            )}
                          </td>
                          <td className="py-1.5 px-3 whitespace-nowrap">{row.unit}</td>
                          <td className="py-1.5 px-3 text-right whitespace-nowrap">
                            ₹{row.listPrice.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-3 text-right text-emerald-600 font-semibold whitespace-nowrap">
                            {row.discountPercentage.toFixed(1)}%
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                            ₹{row.costPrice.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-3 text-right text-blue-700 font-semibold whitespace-nowrap">
                            {row.marginPercentage.toFixed(1)}%
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                            ₹{row.netPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {validatedRows.length > 50 && (
                  <div className="text-[11px] text-center text-slate-400 italic">
                    Showing first 50 rows. All {validRows.length} valid rows will be imported in batches of 100.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={validRows.length === 0}
              onClick={handleStartImport}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                validRows.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              Start Bulk Import ({validRows.length} Products in Batches of 100)
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Completion Overlay Modal */}
      <BulkUploadProgressModal
        isOpen={isProcessing}
        currentBatch={currentBatch}
        totalBatches={totalBatches}
        totalItems={validRows.length}
        processedItems={processedCount}
        estimatedSecondsLeft={estimatedSecondsLeft}
        isComplete={isComplete}
        errorMsg={batchError}
        onClose={handleFinishModal}
      />
    </>
  )
}
