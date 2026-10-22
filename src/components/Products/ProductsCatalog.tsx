import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Sparkles, UploadCloud, Download, FileSpreadsheet } from 'lucide-react'
import type { Product } from '../../types'
import { formatINR } from '../../lib/pricing'
import { downloadCatalogTemplate, exportCatalogToExcel } from '../../lib/excelTemplate'
import { BulkUploadModal } from './BulkUploadModal'

export interface ProductsCatalogProps {
  products: Product[]
  isLoading?: boolean
  enableListPriceMode: boolean
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
  onAddProductClick,
  onEditProduct,
  onDeleteProduct,
  onToggleHero,
  onRefreshProducts,
}) => {
  const [search, setSearch] = useState('')
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)

  const filteredProducts = products.filter(
    (p) =>
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_code.toLowerCase().includes(search.toLowerCase()) ||
      p.unit.toLowerCase().includes(search.toLowerCase())
  )

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
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter products by code, name, or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
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
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={async () => {
          if (onRefreshProducts) {
            await onRefreshProducts()
          }
        }}
      />
    </div>
  )
}
