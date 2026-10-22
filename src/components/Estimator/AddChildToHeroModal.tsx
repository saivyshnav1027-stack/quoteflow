import React, { useState, useEffect, useMemo } from 'react'
import { X, Layers, AlertCircle, Loader2, Check, Sparkles } from 'lucide-react'
import type { EstimateRow, Product, HeroProductWithChildren } from '../../types'
import { getEligibleCartHeroProducts, canProductBeChild } from '../../lib/heroProduct'

export interface AddChildToHeroModalProps {
  isOpen: boolean
  onClose: () => void
  targetRow: EstimateRow | null
  heroProducts: HeroProductWithChildren[]
  allProducts: Product[]
  cartRows?: EstimateRow[]
  onLinkChild: (heroProductId: number, childProductId: number, defaultQuantity: number) => Promise<boolean>
}

export const AddChildToHeroModal: React.FC<AddChildToHeroModalProps> = ({
  isOpen,
  onClose,
  targetRow,
  heroProducts,
  allProducts,
  cartRows = [],
  onLinkChild,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<number | ''>('')
  const [defaultQuantity, setDefaultQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Check if target item is eligible to be a child (cannot be a Hero Product itself)
  const targetProduct = targetRow?.productId
    ? allProducts.find((p) => p.id === targetRow.productId)
    : null
  const childEligibility = targetProduct
    ? canProductBeChild(targetProduct)
    : { allowed: true }

  // Eligible hero products: exclude target product itself
  const eligibleHeroProducts = useMemo(() => {
    return heroProducts.filter((h) => targetRow && h.id !== targetRow.productId)
  }, [heroProducts, targetRow])

  // Heroes specifically present in the current cart
  const cartHeroes = useMemo(() => {
    return getEligibleCartHeroProducts(cartRows, eligibleHeroProducts, targetRow?.productId)
  }, [cartRows, eligibleHeroProducts, targetRow])

  // Other store heroes not in cart
  const otherHeroes = useMemo(() => {
    const cartHeroIds = new Set(cartHeroes.map((h) => h.id))
    return eligibleHeroProducts.filter((h) => !cartHeroIds.has(h.id))
  }, [eligibleHeroProducts, cartHeroes])

  useEffect(() => {
    if (isOpen && targetRow) {
      setDefaultQuantity(Math.max(0.01, targetRow.quantity || 1))
      setErrorMessage('')
      setSuccessMessage('')

      // Prioritize the first hero product in the active cart, else fallback to first eligible hero
      if (cartHeroes.length > 0) {
        setSelectedHeroId(cartHeroes[0].id)
      } else if (eligibleHeroProducts.length > 0) {
        setSelectedHeroId(eligibleHeroProducts[0].id)
      } else {
        setSelectedHeroId('')
      }
    }
  }, [isOpen, targetRow, cartHeroes, eligibleHeroProducts])

  if (!isOpen || !targetRow) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!childEligibility.allowed) {
      setErrorMessage(childEligibility.reason || 'This product cannot be linked as a child component.')
      return
    }

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

        {/* Error message / Constraint violation */}
        {!childEligibility.allowed && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{childEligibility.reason}</span>
          </div>
        )}

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

          {/* Multiple Hero Products Notice & Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Select Parent Hero Product
              </label>
              {cartHeroes.length > 1 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-extrabold">
                  <Sparkles className="h-2.5 w-2.5" />
                  {cartHeroes.length} Hero Products on Cart
                </span>
              )}
            </div>

            {cartHeroes.length > 1 && (
              <p className="text-[11px] text-slate-500 mb-1.5">
                Multiple hero products are currently in your cart. Choose which one this accessory should attach to:
              </p>
            )}

            {eligibleHeroProducts.length > 0 ? (
              <select
                value={selectedHeroId}
                onChange={(e) => setSelectedHeroId(Number(e.target.value))}
                disabled={!childEligibility.allowed}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                {cartHeroes.length > 0 && (
                  <optgroup label="⭐ In Current Active Cart (Recommended)">
                    {cartHeroes.map((h) => (
                      <option key={h.id} value={h.id}>
                        ⭐ {h.product_name} ({h.children?.length || 0} existing child items)
                      </option>
                    ))}
                  </optgroup>
                )}

                {otherHeroes.length > 0 && (
                  <optgroup label="Other Catalog Hero Products">
                    {otherHeroes.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.product_name} ({h.children?.length || 0} existing child items)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500">
                No eligible Hero Products found in the catalog. Please mark a product as Hero first.
              </div>
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
              disabled={!childEligibility.allowed}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              When the selected Hero Product is added to an estimate, this item will auto-populate with this default quantity.
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
              disabled={isSubmitting || !selectedHeroId || !childEligibility.allowed}
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
