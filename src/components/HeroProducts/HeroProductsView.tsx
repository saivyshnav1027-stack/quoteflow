import React, { useState } from 'react'
import {
  Sparkles,
  Plus,
  Trash2,
  Layers,
  Search,
  Save,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react'
import type { HeroProductWithChildren, Product } from '../../types'
import { formatINR } from '../../lib/pricing'

export interface HeroProductsViewProps {
  heroProducts: HeroProductWithChildren[]
  allProducts: Product[]
  isLoading?: boolean
  onToggleHero: (product: Product) => Promise<void>
  onAddChild: (heroProductId: number, childProductId: number, defaultQuantity: number) => Promise<boolean>
  onUpdateChildQuantity: (childMappingId: number, defaultQuantity: number) => Promise<void>
  onDeleteChild: (childMappingId: number) => Promise<void>
  onNavigateToProducts: () => void
}

export const HeroProductsView: React.FC<HeroProductsViewProps> = ({
  heroProducts,
  allProducts,
  isLoading = false,
  onToggleHero,
  onAddChild,
  onUpdateChildQuantity,
  onDeleteChild,
  onNavigateToProducts,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(
    heroProducts.length > 0 ? heroProducts[0].id : null
  )
  const [searchFilter, setSearchFilter] = useState('')

  // Add Child Modal inside HeroProductsView
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [selectedHeroForAdd, setSelectedHeroForAdd] = useState<HeroProductWithChildren | null>(null)
  const [childProductSearch, setChildProductSearch] = useState('')
  const [selectedChildProduct, setSelectedChildProduct] = useState<Product | null>(null)
  const [defaultQuantity, setDefaultQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  // Editing child quantities state
  const [editingQuantities, setEditingQuantities] = useState<Record<number, number>>({})
  const [updatingQuantityId, setUpdatingQuantityId] = useState<number | null>(null)

  const activeHero =
    heroProducts.find((h) => h.id === selectedHeroId) ||
    (heroProducts.length > 0 ? heroProducts[0] : null)

  const filteredHeroProducts = heroProducts.filter(
    (h) =>
      h.product_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      h.product_code.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const handleOpenAddChild = (hero: HeroProductWithChildren) => {
    setSelectedHeroForAdd(hero)
    setSelectedChildProduct(null)
    setChildProductSearch('')
    setDefaultQuantity(1)
    setModalError('')
    setShowAddChildModal(true)
  }

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHeroForAdd || !selectedChildProduct) {
      setModalError('Please choose a child product to add.')
      return
    }

    setIsSubmitting(true)
    setModalError('')

    try {
      const ok = await onAddChild(
        selectedHeroForAdd.id,
        selectedChildProduct.id,
        defaultQuantity
      )
      if (ok) {
        setShowAddChildModal(false)
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to add child component.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveQuantity = async (childMappingId: number) => {
    const qty = editingQuantities[childMappingId]
    if (qty === undefined || qty <= 0) return

    setUpdatingQuantityId(childMappingId)
    try {
      await onUpdateChildQuantity(childMappingId, qty)
      setEditingQuantities((prev) => {
        const next = { ...prev }
        delete next[childMappingId]
        return next
      })
    } finally {
      setUpdatingQuantityId(null)
    }
  }

  // Available child products to add (exclude self and already added children)
  const availableChildren = allProducts.filter((p) => {
    if (!selectedHeroForAdd) return false
    if (p.id === selectedHeroForAdd.id) return false
    const alreadyChild = selectedHeroForAdd.children?.some((c) => c.child_product_id === p.id)
    if (alreadyChild) return false
    if (childProductSearch) {
      const q = childProductSearch.toLowerCase()
      return p.product_name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Hero Products & Component Bundles
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Define primary hardware kits with mapped child accessories that auto-populate at the counter
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToProducts}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Mark More Products as Hero</span>
          </button>
        </div>
      </div>

      {heroProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Hero Products Configured Yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Designate primary catalog items (like Submersible Pumps or PVC Pipes) as Hero Products in the Products Catalog to start mapping child components.
          </p>
          <button
            onClick={onNavigateToProducts}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <span>Go to Products Catalog</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Hero Products Master List */}
          <div className="lg:col-span-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hero Products ({heroProducts.length})
              </span>
            </div>

            {/* Filter Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Hero Products..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50 animate-pulse space-y-2">
                    <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                ))
              ) : (
                filteredHeroProducts.map((h) => {
                const isSelected = activeHero?.id === h.id
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHeroId(h.id)}
                    className={`flex w-full items-start justify-between rounded-xl p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-200 shadow-sm'
                        : 'border border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {h.product_name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Code: {h.product_code} • Cost: {formatINR(h.cost_price)}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        h.children?.length > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {h.children?.length || 0} items
                    </span>
                  </button>
                )
              }))}
            </div>
          </div>

          {/* Right Column: Hero Product Detail & Child Component Management */}
          {activeHero && (
            <div className="lg:col-span-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-6">
              {/* Active Hero Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-xs font-black uppercase tracking-wider">
                      ⭐ Hero Product
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Code: {activeHero.product_code}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {activeHero.product_name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 font-medium">
                    <span>Unit: <b>{activeHero.unit}</b></span>
                    <span>•</span>
                    <span>Cost: <b>{formatINR(activeHero.cost_price)}</b></span>
                    <span>•</span>
                    <span>Margin: <b>{activeHero.margin_percentage ?? 15}%</b></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenAddChild(activeHero)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Child Product</span>
                  </button>

                  <button
                    onClick={() => onToggleHero(activeHero)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
                    title="Remove Hero status from this product"
                  >
                    Unmark Hero
                  </button>
                </div>
              </div>

              {/* Child Products List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Mapped Child Components ({activeHero.children?.length || 0})
                    </h3>
                    <p className="text-xs text-slate-500">
                      These items auto-populate when this Hero Product is selected in the Estimator
                    </p>
                  </div>
                </div>

                {!activeHero.children || activeHero.children.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                    <Layers className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">No child items attached yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "+ Add Child Product" to link accessories, clamps, or fittings to this Hero Product.
                    </p>
                    <button
                      onClick={() => handleOpenAddChild(activeHero)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add First Child Item</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <th className="py-2.5 px-3">Child Component</th>
                          <th className="py-2.5 px-3 w-28">Default Qty</th>
                          <th className="py-2.5 px-3 w-20">Unit</th>
                          <th className="py-2.5 px-3 text-right w-28">Cost Price</th>
                          <th className="py-2.5 px-2 text-center w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                        {activeHero.children.map((child) => {
                          const currentQty =
                            editingQuantities[child.id] !== undefined
                              ? editingQuantities[child.id]
                              : child.default_quantity
                          const isEdited =
                            editingQuantities[child.id] !== undefined &&
                            editingQuantities[child.id] !== child.default_quantity

                          return (
                            <tr key={child.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">
                                  {child.child_product_name || `Product #${child.child_product_id}`}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Code: {child.child_product_code || 'N/A'}
                                </div>
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.01"
                                    value={currentQty}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0
                                      setEditingQuantities((prev) => ({
                                        ...prev,
                                        [child.id]: val,
                                      }))
                                    }}
                                    className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                                  />
                                  {isEdited && (
                                    <button
                                      onClick={() => handleSaveQuantity(child.id)}
                                      disabled={updatingQuantityId === child.id}
                                      className="p-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                                      title="Save updated default quantity"
                                    >
                                      {updatingQuantityId === child.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Save className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-slate-600 font-semibold">
                                {child.child_unit || 'Pcs.'}
                              </td>

                              <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                                {child.child_cost_price ? formatINR(child.child_cost_price) : '—'}
                              </td>

                              <td className="py-2.5 px-2 text-center">
                                <button
                                  onClick={() => onDeleteChild(child.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Remove child product from bundle"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Child Component Dialog Modal */}
      {showAddChildModal && selectedHeroForAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Add Child Component to {selectedHeroForAdd.product_name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Search catalog items to bundle with this Hero Product
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddChildModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveChild} className="mt-4 space-y-4">
              {/* Search catalog */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Search & Pick Child Item
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search catalog products..."
                    value={childProductSearch}
                    onChange={(e) => setChildProductSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {availableChildren.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching unbundled products found
                    </div>
                  ) : (
                    availableChildren.map((p) => {
                      const isChosen = selectedChildProduct?.id === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedChildProduct(p)}
                          className={`flex w-full items-center justify-between p-2.5 text-left text-xs transition-colors cursor-pointer ${
                            isChosen ? 'bg-blue-50 font-bold text-blue-900' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-slate-900">{p.product_name}</span>
                            <span className="text-[11px] text-slate-400 ml-2">({p.product_code})</span>
                          </div>
                          <span className="text-slate-600">{p.unit} • {formatINR(p.cost_price)}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {selectedChildProduct && (
                <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3 text-xs">
                  <span className="font-bold text-blue-900">Selected: </span>
                  <span className="text-blue-800">{selectedChildProduct.product_name}</span>
                  <span className="text-blue-600 ml-1">({selectedChildProduct.unit})</span>
                </div>
              )}

              {/* Default Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Bundle Quantity {selectedChildProduct ? `(${selectedChildProduct.unit})` : ''}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={defaultQuantity}
                  onChange={(e) => setDefaultQuantity(Math.max(0.01, parseFloat(e.target.value) || 1))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedChildProduct}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Adding...' : 'Add to Bundle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
