import React, { useState, useEffect } from 'react'
import { X, Loader2, Sparkles } from 'lucide-react'
import type { Product, PricingSuperiorityMode } from '../../types'
import {
  calculateCostFromListAndDiscount,
  calculateDiscountFromListAndCost,
  calculateNetPriceFromCostAndMargin,
  calculateMarginFromCostAndNetPrice,
} from '../../lib/pricing'

export interface EditProductModalProps {
  product: Product | null
  enableListPriceMode: boolean
  defaultSuperiorityMode?: PricingSuperiorityMode
  onClose: () => void
  onSave: (product: Product) => Promise<void>
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  enableListPriceMode,
  defaultSuperiorityMode = 'PRICE',
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Product | null>(product)
  const [superiorityMode, setSuperiorityMode] = useState<PricingSuperiorityMode>(defaultSuperiorityMode)
  const [netPrice, setNetPrice] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFormData(product)
    setSuperiorityMode(defaultSuperiorityMode)
    if (product) {
      setNetPrice(
        calculateNetPriceFromCostAndMargin(product.cost_price, product.margin_percentage ?? 15)
      )
    } else {
      setNetPrice('')
    }
  }, [product, defaultSuperiorityMode])

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

          {/* Superiority Priority Mode Toggle Pill */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Priority:</span>
            </div>
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setSuperiorityMode('PRICE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  superiorityMode === 'PRICE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cost Price (₹) & Net Price (₹) are ground truth. Trade Dis% and Margin% are derived."
              >
                ₹ Amounts Superior
              </button>
              <button
                type="button"
                onClick={() => setSuperiorityMode('PERCENTAGE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  superiorityMode === 'PERCENTAGE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Trade Discount % & Margin % are locked. Cost Price and Net Price are recomputed."
              >
                % Percentages Superior
              </button>
            </div>
          </div>

          {enableListPriceMode ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">List (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.list_price}
                  onChange={(e) => {
                    const list = parseFloat(e.target.value) || 0
                    const dis = formData.discount_percentage || 0
                    const cost = formData.cost_price || 0
                    const m = formData.margin_percentage ?? 15
                    if (list > 0) {
                      if (superiorityMode === 'PRICE' && cost > 0) {
                        const newDis = calculateDiscountFromListAndCost(list, cost)
                        setFormData({ ...formData, list_price: list, discount_percentage: newDis })
                      } else {
                        const newCost = calculateCostFromListAndDiscount(list, dis)
                        setFormData({ ...formData, list_price: list, cost_price: newCost })
                        setNetPrice(calculateNetPriceFromCostAndMargin(newCost, m))
                      }
                    } else {
                      setFormData({ ...formData, list_price: list })
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trade Dis% {superiorityMode === 'PERCENTAGE' && <span className="text-[10px] text-blue-600 font-extrabold">★</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => {
                    const dis = parseFloat(e.target.value) || 0
                    const list = formData.list_price || 0
                    const m = formData.margin_percentage ?? 15
                    const cost = calculateCostFromListAndDiscount(list, dis)
                    setFormData({ ...formData, discount_percentage: dis, cost_price: cost })
                    setNetPrice(calculateNetPriceFromCostAndMargin(cost, m))
                  }}
                  className={`w-full rounded-xl border px-2.5 py-2 text-xs outline-none font-bold text-emerald-600 ${
                    superiorityMode === 'PERCENTAGE' ? 'border-blue-400 ring-1 ring-blue-300' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cost (₹) {superiorityMode === 'PRICE' && <span className="text-[10px] text-emerald-600 font-extrabold">★</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => {
                    const cost = parseFloat(e.target.value) || 0
                    const list = formData.list_price || 0
                    const m = formData.margin_percentage ?? 15
                    const n = typeof netPrice === 'number' ? netPrice : 0
                    const dis =
                      list > 0 && cost > 0
                        ? calculateDiscountFromListAndCost(list, cost)
                        : formData.discount_percentage

                    if (cost > 0 && superiorityMode === 'PRICE' && n > 0) {
                      const newM = calculateMarginFromCostAndNetPrice(cost, n)
                      setFormData({ ...formData, cost_price: cost, discount_percentage: dis, margin_percentage: newM })
                    } else {
                      setFormData({ ...formData, cost_price: cost, discount_percentage: dis })
                      setNetPrice(calculateNetPriceFromCostAndMargin(cost, m))
                    }
                  }}
                  className={`w-full rounded-xl border px-2.5 py-2 text-xs outline-none font-bold text-slate-700 ${
                    superiorityMode === 'PRICE' ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Margin% {superiorityMode === 'PERCENTAGE' && <span className="text-[10px] text-blue-600 font-extrabold">★</span>}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.margin_percentage ?? 15}
                  onChange={(e) => {
                    const m = parseFloat(e.target.value) || 0
                    setFormData({
                      ...formData,
                      margin_percentage: m,
                    })
                    setNetPrice(calculateNetPriceFromCostAndMargin(formData.cost_price, m))
                  }}
                  className={`w-full rounded-xl border bg-blue-50/40 px-2.5 py-2 text-xs outline-none font-bold text-blue-700 ${
                    superiorityMode === 'PERCENTAGE' ? 'border-blue-400 ring-1 ring-blue-300' : 'border-blue-200 focus:border-blue-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-700 mb-1">
                  Net Price (₹) {superiorityMode === 'PRICE' && <span className="text-[10px] text-emerald-600 font-extrabold">★</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Auto"
                  value={netPrice}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value) || 0
                    setNetPrice(n)
                    if (formData.cost_price > 0 && n > 0) {
                      const m = calculateMarginFromCostAndNetPrice(formData.cost_price, n)
                      setFormData({
                        ...formData,
                        margin_percentage: m,
                      })
                    }
                  }}
                  className={`w-full rounded-xl border bg-emerald-50/50 px-2.5 py-2 text-xs outline-none font-mono font-bold text-emerald-800 ${
                    superiorityMode === 'PRICE' ? 'border-emerald-500 ring-1 ring-emerald-300' : 'border-emerald-300 focus:border-emerald-500'
                  }`}
                  title="Net selling price (auto updates margin %)"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cost Price (₹) {superiorityMode === 'PRICE' && <span className="text-[10px] text-emerald-600 font-extrabold">★</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => {
                    const cost = parseFloat(e.target.value) || 0
                    const m = formData.margin_percentage ?? 15
                    const n = typeof netPrice === 'number' ? netPrice : 0
                    if (cost > 0 && superiorityMode === 'PRICE' && n > 0) {
                      const newM = calculateMarginFromCostAndNetPrice(cost, n)
                      setFormData({ ...formData, cost_price: cost, margin_percentage: newM })
                    } else {
                      setFormData({ ...formData, cost_price: cost })
                      setNetPrice(calculateNetPriceFromCostAndMargin(cost, m))
                    }
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none font-bold text-slate-900 ${
                    superiorityMode === 'PRICE' ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Margin (%) {superiorityMode === 'PERCENTAGE' && <span className="text-[10px] text-blue-600 font-extrabold">★</span>}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.margin_percentage ?? 15}
                  onChange={(e) => {
                    const m = parseFloat(e.target.value) || 0
                    setFormData({
                      ...formData,
                      margin_percentage: m,
                    })
                    setNetPrice(calculateNetPriceFromCostAndMargin(formData.cost_price, m))
                  }}
                  className={`w-full rounded-xl border bg-blue-50/40 px-3 py-2 text-sm outline-none font-bold text-blue-700 ${
                    superiorityMode === 'PERCENTAGE' ? 'border-blue-400 ring-1 ring-blue-300' : 'border-blue-200 focus:border-blue-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-700 mb-1">
                  Net Price (₹) {superiorityMode === 'PRICE' && <span className="text-[10px] text-emerald-600 font-extrabold">★</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Auto"
                  value={netPrice}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value) || 0
                    setNetPrice(n)
                    if (formData.cost_price > 0 && n > 0) {
                      const m = calculateMarginFromCostAndNetPrice(formData.cost_price, n)
                      setFormData({
                        ...formData,
                        margin_percentage: m,
                      })
                    }
                  }}
                  className={`w-full rounded-xl border bg-emerald-50/50 px-3 py-2 text-sm outline-none font-mono font-bold text-emerald-800 ${
                    superiorityMode === 'PRICE' ? 'border-emerald-500 ring-1 ring-emerald-300' : 'border-emerald-300 focus:border-emerald-500'
                  }`}
                  title="Net selling price (auto updates margin %)"
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
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Updating...' : 'Update Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
