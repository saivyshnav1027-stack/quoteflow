import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Product } from '../../types'

export interface EditProductModalProps {
  product: Product | null
  enableListPriceMode: boolean
  onClose: () => void
  onSave: (product: Product) => Promise<void>
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  enableListPriceMode,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Product | null>(product)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFormData(product)
  }, [product])

  if (!product || !formData) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            Edit Product: {formData.product_name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description of Goods
            </label>
            <input
              type="text"
              required
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Code</label>
              <input
                type="text"
                value={formData.product_code}
                onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="Pcs.">Pcs.</option>
                <option value="Kgs.">Kgs.</option>
                <option value="Mtr.">Mtr.</option>
                <option value="Rolls">Rolls</option>
                <option value="Sets">Sets</option>
                <option value="Ft.">Ft.</option>
              </select>
            </div>
          </div>

          {enableListPriceMode ? (
            <div className="grid grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">List (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.list_price}
                  onChange={(e) => {
                    const list = parseFloat(e.target.value) || 0
                    const dis = formData.discount_percentage || 0
                    const cost = Number((list * (1 - dis / 100)).toFixed(2))
                    setFormData({ ...formData, list_price: list, cost_price: cost })
                  }}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trade Dis%</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => {
                    const dis = parseFloat(e.target.value) || 0
                    const list = formData.list_price || 0
                    const cost = Number((list * (1 - dis / 100)).toFixed(2))
                    setFormData({ ...formData, discount_percentage: dis, cost_price: cost })
                  }}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold text-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Margin%</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.margin_percentage ?? 15}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      margin_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold text-blue-700"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Margin (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.margin_percentage ?? 15}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      margin_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2 text-sm outline-none focus:border-blue-500 font-bold text-blue-700"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
