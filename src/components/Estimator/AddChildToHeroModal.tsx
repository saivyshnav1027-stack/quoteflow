import React, { useState, useEffect } from 'react'
import { X, Layers, AlertCircle, Loader2, Check } from 'lucide-react'
import type { EstimateRow, Product, HeroProductWithChildren } from '../../types'

export interface AddChildToHeroModalProps {
  isOpen: boolean
  onClose: () => void
  targetRow: EstimateRow | null
  heroProducts: HeroProductWithChildren[]
  allProducts: Product[]
  onLinkChild: (heroProductId: number, childProductId: number, defaultQuantity: number) => Promise<boolean>
}

export const AddChildToHeroModal: React.FC<AddChildToHeroModalProps> = ({
  isOpen,
  onClose,
  targetRow,
  heroProducts,
  allProducts,
  onLinkChild,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<number | ''>('')
  const [defaultQuantity, setDefaultQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Eligible hero products: cannot link product to itself
  const eligibleHeroProducts = heroProducts.filter(
    (h) => targetRow && h.id !== targetRow.productId
  )

  // Non-hero products that could be promoted if no hero products exist
  const potentialHeroProducts = allProducts.filter(
    (p) => targetRow && p.id !== targetRow.productId
  )

  useEffect(() => {
    if (isOpen && targetRow) {
      setDefaultQuantity(Math.max(0.01, targetRow.quantity || 1))
      setErrorMessage('')
      setSuccessMessage('')
      if (eligibleHeroProducts.length > 0) {
        setSelectedHeroId(eligibleHeroProducts[0].id)
      } else if (potentialHeroProducts.length > 0) {
        setSelectedHeroId(potentialHeroProducts[0].id)
      } else {
        setSelectedHeroId('')
      }
    }
  }, [isOpen, targetRow])

  if (!isOpen || !targetRow) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHeroId) {
      setErrorMessage('Please select a Hero Product to link this component to.')
      return
    }

    if (!targetRow.productId) {
      setErrorMessage('This item is not a catalog product. Only catalog products can be linked.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const ok = await onLinkChild(Number(selectedHeroId), targetRow.productId, defaultQuantity)
      if (ok) {
        setSuccessMessage('Successfully linked as child component!')
        setTimeout(() => {
          onClose()
        }, 1200)
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to link child component.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add as Child Component</h3>
              <p className="text-[11px] text-slate-500">Link this item to a Hero Product bundle</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target Child Component Info */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Component to Link
            </span>
            <div className="font-bold text-xs text-slate-800 mt-0.5">{targetRow.description}</div>
            <div className="text-[11px] text-slate-500">
              Code: {targetRow.productCode || 'N/A'} • Unit: {targetRow.unit}
            </div>
          </div>

          {/* Select Hero Product */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Parent Hero Product
            </label>
            {eligibleHeroProducts.length > 0 ? (
              <select
                value={selectedHeroId}
                onChange={(e) => setSelectedHeroId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {eligibleHeroProducts.map((h) => (
                  <option key={h.id} value={h.id}>
                    ⭐ {h.product_name} ({h.children?.length || 0} existing child items)
                  </option>
                ))}
              </select>
            ) : potentialHeroProducts.length > 0 ? (
              <div>
                <p className="text-[11px] text-amber-700 mb-1.5 font-medium">
                  No products are currently marked as Hero Products. Select any product below to promote it as a Hero Product:
                </p>
                <select
                  value={selectedHeroId}
                  onChange={(e) => setSelectedHeroId(Number(e.target.value))}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                >
                  {potentialHeroProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({p.product_code})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No available products found in catalog.</p>
            )}
          </div>

          {/* Default Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Default Bundle Quantity ({targetRow.unit})
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={defaultQuantity}
              onChange={(e) => setDefaultQuantity(Math.max(0.01, parseFloat(e.target.value) || 1))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              When the Hero Product is selected in the Estimator, this item will auto-populate with this default quantity.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedHeroId}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Linking...' : 'Confirm & Link'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
