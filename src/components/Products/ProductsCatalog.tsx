import React, { useState, useMemo } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  UploadCloud,
  Download,
  FileSpreadsheet,
  History,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react'
import type { Product, PricingSuperiorityMode } from '../../types'
import { formatINR } from '../../lib/pricing'
import { downloadCatalogTemplate, exportCatalogToExcel } from '../../lib/excelTemplate'
import { BulkUploadModal } from './BulkUploadModal'
import { UploadHistoryModal } from './UploadHistoryModal'

export interface ProductsCatalogProps {
  products: Product[]
  isLoading?: boolean
  enableListPriceMode: boolean
  pricingSuperiorityMode?: PricingSuperiorityMode
  onAddProductClick: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (product: Product) => Promise<void> | void
  onToggleHero?: (product: Product) => Promise<void> | void
  onRefreshProducts?: () => Promise<void>
}

export const ProductsCatalog: React.FC<ProductsCatalogProps> = ({
  products,
  isLoading = false,
  enableListPriceMode,
  pricingSuperiorityMode,
  onAddProductClick,
  onEditProduct,
  onDeleteProduct,
  onToggleHero,
  onRefreshProducts,
}) => {
  const [search, setSearch] = useState('')
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'stock' | 'qa'>('all')
  const [showPurgeQaModal, setShowPurgeQaModal] = useState(false)
  const [isPurgingQa, setIsPurgingQa] = useState(false)

  // Categorize QA test products vs Authentic stock
  const qaProducts = useMemo(
    () => products.filter((p) => p.product_code.startsWith('QA_') || p.product_name.startsWith('QA_')),
    [products]
  )

  const stockProducts = useMemo(
    () => products.filter((p) => !p.product_code.startsWith('QA_') && !p.product_name.startsWith('QA_')),
    [products]
  )

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isQa = p.product_code.startsWith('QA_') || p.product_name.startsWith('QA_')
      if (catalogFilter === 'stock' && isQa) return false
      if (catalogFilter === 'qa' && !isQa) return false

      const s = search.toLowerCase()
      return (
        p.product_name.toLowerCase().includes(s) ||
        p.product_code.toLowerCase().includes(s) ||
        p.unit.toLowerCase().includes(s)
      )
    })
  }, [products, search, catalogFilter])

  const handleExecutePurgeQa = async () => {
    setIsPurgingQa(true)
    try {
      const res = await fetch('/api/products?action=purge-qa', {
        method: 'DELETE',
      })
      if (res.ok) {
        setShowPurgeQaModal(false)
        if (onRefreshProducts) {
          await onRefreshProducts()
        }
      } else {
        alert('Failed to purge QA test records.')
      }
    } catch (e) {
      console.error(e)
      alert('Error during QA purge.')
    } finally {
      setIsPurgingQa(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products Catalog</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage hardware, pipes, fittings, motors, and wholesale pricing
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="View upload history audit trail and re-download imported snapshots"
          >
            <History className="h-3.5 w-3.5 text-indigo-600" />
            <span>Upload History</span>
          </button>

          <button
            type="button"
            onClick={() => downloadCatalogTemplate()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="Download blank Excel spreadsheet formatted for bulk catalog upload"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Blank Template</span>
          </button>

          <button
            type="button"
            onClick={() => exportCatalogToExcel(products)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="Export all current catalog products with list prices, trade discounts, and net prices to Excel"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm cursor-pointer"
            title="Upload supplier price sheets (.xlsx, .csv) with automatic calculations"
          >
            <UploadCloud className="h-4 w-4 text-blue-600" />
            <span>Bulk Upload</span>
          </button>

          <button
            type="button"
            onClick={onAddProductClick}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer shadow-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        {/* Search Bar & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <input
            type="text"
            placeholder="Filter products by code, name, or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />

          <div className="flex items-center space-x-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCatalogFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  catalogFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogFilter('stock')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  catalogFilter === 'stock'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock ({stockProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogFilter('qa')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  catalogFilter === 'qa'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                QA Test ({qaProducts.length})
              </button>
            </div>

            {qaProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPurgeQaModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer"
                title="Delete all QA test products with QA_* codes"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Purge QA ({qaProducts.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Unit</th>
                {enableListPriceMode && (
                  <>
                    <th className="py-3 px-4 text-right">List Price (₹)</th>
                    <th className="py-3 px-3 text-right">Dis%</th>
                  </>
                )}
                <th className="py-3 px-4 text-right">Cost Price (₹)</th>
                <th className="py-3 px-3 text-right">Margin%</th>
                <th className="py-3 px-3 text-center">Hero Item</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-44" /></td>
                    <td className="py-3 px-3"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                    {enableListPriceMode && (
                      <>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto" /></td>
                        <td className="py-3 px-3 text-right"><div className="h-4 bg-emerald-100 rounded w-12 ml-auto" /></td>
                      </>
                    )}
                    <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto" /></td>
                    <td className="py-3 px-3 text-right"><div className="h-4 bg-blue-100 rounded w-12 ml-auto" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-6 bg-slate-100 rounded-lg w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={enableListPriceMode ? 8 : 6} className="py-12 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-600">{p.product_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.product_name}</td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-600">
                        {p.unit}
                      </span>
                    </td>
                    {enableListPriceMode && (
                      <>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatINR(p.list_price)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          {p.discount_percentage}%
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(p.cost_price)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        +{p.margin_percentage ?? 15}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {onToggleHero ? (
                        <button
                          type="button"
                          onClick={() => onToggleHero(p)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${Boolean(p.is_hero)
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          title={
                            Boolean(p.is_hero)
                              ? 'Click to unmark as Hero Product'
                              : 'Click to make this a Hero Product for bundles'
                          }
                        >
                          <Sparkles
                            className={`h-3 w-3 ${Boolean(p.is_hero) ? 'text-amber-600 fill-amber-500' : 'text-slate-400'
                              }`}
                          />
                          <span>{Boolean(p.is_hero) ? 'Hero' : 'Set Hero'}</span>
                        </button>
                      ) : (
                        Boolean(p.is_hero) && (
                          <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-extrabold">
                            ⭐ Hero
                          </span>
                        )
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onEditProduct(p)}
                        className="rounded p-1 text-slate-400 hover:text-blue-600 mr-2 cursor-pointer"
                        title="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p)}
                        className="rounded p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </div>

      <BulkUploadModal
        isOpen={showBulkUploadModal}
        existingProducts={products}
        defaultSuperiorityMode={pricingSuperiorityMode}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={async () => {
          if (onRefreshProducts) {
            await onRefreshProducts()
          }
        }}
      />

      <UploadHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      {/* Confirmation Modal for QA Test Records Purge */}
      {showPurgeQaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Purge QA Test Records
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPurgeQaModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Found <span className="font-extrabold text-slate-900">{qaProducts.length}</span> test products matching <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 font-mono font-bold">QA_*</code>.
              </p>
              <p className="text-xs text-slate-500">
                This will safely delete all test items without affecting your authentic stock catalog ({stockProducts.length} items).
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPurgeQaModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurgingQa}
                onClick={handleExecutePurgeQa}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isPurgingQa ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting QA Items...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Purge {qaProducts.length} QA Products</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
