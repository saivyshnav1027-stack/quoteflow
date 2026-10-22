import React, { useEffect, useState } from 'react'
import { X, History, FileSpreadsheet, Download, Loader2, Calendar, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'

export interface CatalogImportRecord {
  id: number
  filename: string
  file_size_kb: number
  total_rows: number
  new_count: number
  update_count: number
  pricing_mode: string
  snapshot_json?: string
  created_at: string
}

export interface UploadHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UploadHistoryModal: React.FC<UploadHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<CatalogImportRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  const loadHistory = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/catalog-imports')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setHistory(data)
        }
      } else {
        throw new Error('Failed to load import audit trail')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Could not fetch upload history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadSnapshot = (record: CatalogImportRecord) => {
    try {
      if (!record.snapshot_json) {
        alert('No row snapshot was stored for this upload record.')
        return
      }

      const rows: any[] = JSON.parse(record.snapshot_json)
      if (!Array.isArray(rows) || rows.length === 0) {
        alert('Snapshot data is empty.')
        return
      }

      const headers = [
        'Product Code',
        'Product Name',
        'Unit',
        'List Price',
        'Trade Discount %',
        'Cost Price',
        'Margin %',
        'Net Price',
      ]

      const dataRows = rows.map((r) => [
        r.productCode || '',
        r.productName || '',
        r.unit || 'Pcs.',
        r.listPrice || 0,
        r.discountPercentage || 0,
        r.costPrice || 0,
        r.marginPercentage || 15,
        r.netPrice || 0,
      ])

      const worksheetData = [headers, ...dataRows]
      const ws = XLSX.utils.aoa_to_sheet(worksheetData)
      ws['!cols'] = [
        { wch: 18 },
        { wch: 42 },
        { wch: 10 },
        { wch: 12 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Imported_Snapshot')

      const baseName = record.filename.replace(/\.[^/.]+$/, '')
      XLSX.writeFile(wb, `Snapshot_${baseName}_${record.id}.xlsx`)
    } catch (e) {
      console.error('Error generating snapshot export:', e)
      alert('Failed to parse and export snapshot data.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Bulk Upload Audit History
              </h2>
              <p className="text-xs text-slate-500">
                Persistent audit trail and row snapshots of all supplier spreadsheet imports
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
              <span className="text-xs font-semibold">Loading import history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No Bulk Imports Yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Whenever supplier spreadsheets are ingested, their audit logs and row snapshots will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
              {history.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-sm font-extrabold text-slate-900">
                        {rec.filename}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          rec.pricing_mode === 'MODE_B'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rec.pricing_mode === 'MODE_B' ? 'Percentages Priority' : 'Amounts Priority'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(rec.created_at).toLocaleString('en-IN')}</span>
                      </span>
                      <span>•</span>
                      <span><b>{rec.total_rows}</b> total rows</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">+{rec.new_count} new</span>
                      <span>•</span>
                      <span className="text-blue-700 font-semibold">~{rec.update_count} updated</span>
                    </div>
                  </div>

                  {rec.snapshot_json && (
                    <button
                      type="button"
                      onClick={() => handleDownloadSnapshot(rec)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs cursor-pointer transition-all self-start sm:self-auto shrink-0"
                      title="Download the exact rows imported in this batch as an Excel file"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>Download Snapshot</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
