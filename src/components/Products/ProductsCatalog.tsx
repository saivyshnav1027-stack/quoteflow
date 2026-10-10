import React, { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Product } from '../../types'
import { formatINR } from '../../lib/pricing'

export interface ProductsCatalogProps {
  products: Product[]
  enableListPriceMode: boolean
  onAddProductClick: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (product: Product) => Promise<void>
}

export const ProductsCatalog: React.FC<ProductsCatalogProps> = ({
  products,
  enableListPriceMode,
  onAddProductClick,
  onEditProduct,
  onDeleteProduct,
}) => {
  const [search, setSearch] = useState('')

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
        <button
          onClick={onAddProductClick}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
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
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredProducts.map((p) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
