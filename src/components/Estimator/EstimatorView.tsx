import React, { useState, useRef, useEffect } from 'react'
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  RotateCcw,
  X,
  Printer,
  Share2,
  Check,
  Layers,
} from 'lucide-react'
import type { Customer, Product, EstimateRow, HeroProductWithChildren, EstimatorSummary } from '../../types'
import { formatINR } from '../../lib/pricing'
import { isChildLinkEnabled } from '../../lib/heroProduct'
import { AddChildToHeroModal } from './AddChildToHeroModal'

export interface EstimatorViewProps {
  currentEstimateNo: string
  onNewEstimateClick: () => void
  customers: Customer[]
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer) => void
  onNewCustomerClick: () => void
  products: Product[]
  onAddProductToEstimate: (product: Product) => void
  onAddNewProductClick: (prefillName?: string) => void
  estimateRows: EstimateRow[]
  onUpdateRow: (id: string, field: keyof EstimateRow, value: any) => void
  onRemoveRow: (id: string) => void
  summary: EstimatorSummary
  cashDiscount?: number
  onCashDiscountChange?: (val: number) => void
  enableListPriceMode: boolean
  whatsappSharedNotice: boolean
  onDismissWhatsAppNotice: () => void
  onClearEstimateDirect: () => void
  onClearEstimate: () => void
  onOpenPrintSlip: () => void
  onShareWhatsApp: () => void
  onSaveEstimate: () => void
  isSavingQuote: boolean
  isEditing?: boolean
  editingEstimateNo?: string
  onCancelEdit?: () => void
  heroProducts?: HeroProductWithChildren[]
  onLinkChildToHero?: (heroProductId: number, childProductId: number, defaultQuantity: number) => Promise<boolean>
}

export const EstimatorView: React.FC<EstimatorViewProps> = ({
  currentEstimateNo,
  onNewEstimateClick,
  customers,
  selectedCustomer,
  onSelectCustomer,
  onNewCustomerClick,
  products,
  onAddProductToEstimate,
  onAddNewProductClick,
  estimateRows,
  onUpdateRow,
  onRemoveRow,
  summary,
  cashDiscount = 0,
  onCashDiscountChange,
  enableListPriceMode,
  whatsappSharedNotice,
  onDismissWhatsAppNotice,
  onClearEstimateDirect,
  onClearEstimate,
  onOpenPrintSlip,
  onShareWhatsApp,
  onSaveEstimate,
  isSavingQuote,
  isEditing = false,
  editingEstimateNo,
  onCancelEdit,
  heroProducts = [],
  onLinkChildToHero,
}) => {
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [addChildModalTarget, setAddChildModalTarget] = useState<EstimateRow | null>(null)

  const customerContainerRef = useRef<HTMLDivElement>(null)
  const productContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerContainerRef.current &&
        !customerContainerRef.current.contains(e.target as Node)
      ) {
        setShowCustomerDropdown(false)
      }
      if (
        productContainerRef.current &&
        !productContainerRef.current.contains(e.target as Node)
      ) {
        setShowProductDropdown(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCustomerDropdown(false)
        setShowProductDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const filteredCustomers = customers.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const filteredProducts = products.filter(
    (p) =>
      p.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.product_code.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quote Estimator</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Generate instant estimates for walk-in customers & wholesale agri-parties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-blue-600" />
            <span>Est No: #{currentEstimateNo}</span>
          </span>
          <button
            onClick={onNewEstimateClick}
            className="flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition-colors cursor-pointer shadow-sm"
            title="Start new blank estimate with next sequential number"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Estimate</span>
          </button>
        </div>
      </div>

      {/* Editing Saved Estimate Banner */}
      {isEditing && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-3.5 text-amber-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div className="text-xs">
              <span className="font-extrabold text-amber-950">
                Editing Saved Estimate #{editingEstimateNo || currentEstimateNo}
              </span>
              <span className="ml-1.5 text-amber-700">
                — Modifying this estimate will update the existing database record and slip.
              </span>
            </div>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="self-start sm:self-auto rounded-xl bg-white border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer transition-colors shadow-sm"
            >
              Cancel Edit / New Estimate
            </button>
          )}
        </div>
      )}

      {/* Section A: Customer Selector Bar */}
      <div className="relative rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Customer Search / Picker */}
          <div ref={customerContainerRef} className="relative flex-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search existing customer by Name or Phone (+91)..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  setShowCustomerDropdown(true)
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {(customerSearch || showCustomerDropdown) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearch('')
                    setShowCustomerDropdown(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
                  title="Close dropdown / clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Customer Dropdown (calibrated to ~5 items visible with smooth scroll) */}
            {showCustomerDropdown && (
              <div className="absolute left-0 right-0 top-12 z-30 max-h-[250px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50/95 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Customers ({filteredCustomers.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomerDropdown(false)}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-800 cursor-pointer"
                  >
                    <span>Close</span>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-1">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No matching customers found
                    </div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectCustomer(c)
                          setShowCustomerDropdown(false)
                          setCustomerSearch('')
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{c.customer_name}</span>
                          <span className="text-xs text-slate-400">{c.phone || 'No phone'}</span>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          #{c.id}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNewCustomerClick}
              className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Customer</span>
            </button>
            <button
              onClick={() => {
                onSelectCustomer({
                  id: 0,
                  customer_name: 'Guest Walk-In',
                  phone: '',
                  customer_type_id: 1,
                  type_name: '',
                  markup_percentage: 0,
                })
                setCustomerSearch('')
                setShowCustomerDropdown(false)
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Guest Walk-In
            </button>
          </div>
        </div>

        {/* Selected Customer Banner */}
        {selectedCustomer && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm">
                {selectedCustomer.customer_name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{selectedCustomer.customer_name}</span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                    {selectedCustomer.id === 0 ? 'Cash Customer' : 'Counter Client'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {selectedCustomer.phone || 'Walk-in / Cash Customer'}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-400">Direct product margin pricing applied</div>
          </div>
        )}
      </div>

      {/* Section B: Product Search Bar */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div ref={productContainerRef} className="relative flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Type product name, pipe size, clamp or code (e.g. CPVC, Ashirwad, Nandi, FRP)..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  setShowProductDropdown(true)
                }}
                onFocus={() => setShowProductDropdown(true)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {(productSearch || showProductDropdown) && (
                <button
                  type="button"
                  onClick={() => {
                    setProductSearch('')
                    setShowProductDropdown(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
                  title="Close dropdown / clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Product Dropdown (calibrated to ~5 items visible with smooth scroll) */}
            {showProductDropdown && (
              <div className="absolute left-0 right-0 top-12 z-30 max-h-[260px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50/95 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Inventory Items ({filteredProducts.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProductDropdown(false)}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-800 cursor-pointer"
                  >
                    <span>Close</span>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-1">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-slate-500 mb-2">
                        "{productSearch}" is not in inventory.
                      </p>
                      <button
                        onClick={() => {
                          onAddNewProductClick(productSearch)
                          setShowProductDropdown(false)
                        }}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                      >
                        + Add "{productSearch}" to Inventory
                      </button>
                    </div>
                  ) : (
                    <>
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            onAddProductToEstimate(p)
                            setProductSearch('')
                            setShowProductDropdown(false)
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">{p.product_name}</span>
                              {Boolean(p.is_hero) && (
                                <span className="rounded-md bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                                  ⭐ Hero Bundle
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              Code: {p.product_code} | Unit: {p.unit}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            {enableListPriceMode ? (
                              <>
                                <span className="font-bold text-slate-900">
                                  List: {formatINR(p.list_price)}
                                </span>
                                {p.discount_percentage > 0 && (
                                  <span className="text-xs text-emerald-600 font-semibold">
                                    Dis: {p.discount_percentage}%
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-slate-900">
                                  Cost: {formatINR(p.cost_price)}
                                </span>
                                <span className="text-xs text-blue-600 font-semibold">
                                  Margin: {p.margin_percentage ?? 15}%
                                </span>
                              </>
                            )}
                          </div>
                        </button>
                      ))}
                      <div className="mt-1 border-t border-slate-100 pt-1 text-center">
                        <button
                          onClick={() => {
                            onAddNewProductClick(productSearch)
                            setShowProductDropdown(false)
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline py-1 cursor-pointer"
                        >
                          + Add Custom / Unlisted Product to Catalog
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onAddNewProductClick()}
            className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Product</span>
          </button>
        </div>

        {/* Estimate Line Items Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 select-none">
                <th className="py-3 px-3 text-center w-12 text-[11px]">S.N.</th>
                <th className="py-3 px-3 min-w-[200px] text-[11px]">Description of Goods</th>
                <th className="py-3 px-3 text-right w-20 text-[11px]">Qty.</th>
                <th className="py-3 px-2 text-center w-20 text-[11px]">Unit</th>
                {enableListPriceMode && (
                  <>
                    <th className="py-3 px-3 text-right w-24 text-[11px]">List Price (₹)</th>
                    <th className="py-3 px-3 text-right w-20 text-[11px]">Trade Dis%</th>
                  </>
                )}
                <th className="py-3 px-3 text-right w-24 text-[11px]">Cost Price (₹)</th>
                <th className="py-3 px-3 text-right w-20 text-[11px]">Margin%</th>
                <th className="py-3 px-3 text-right w-28 text-[11px]">Net Price (₹)</th>
                <th className="py-3 px-3 text-right w-32 text-[11px]">Amount (₹)</th>
                <th className="py-3 px-3 text-center w-24 text-[11px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {estimateRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={enableListPriceMode ? 11 : 9}
                    className="py-12 text-center text-slate-400 text-sm"
                  >
                    No items added to estimate yet. Use the product search bar above to add items.
                  </td>
                </tr>
              ) : (
                estimateRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}.</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => onUpdateRow(row.id, 'description', e.target.value)}
                        className="w-full rounded bg-transparent px-1 py-0.5 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={row.quantity}
                        onChange={(e) =>
                          onUpdateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right font-bold text-slate-900 outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <select
                        value={row.unit}
                        onChange={(e) => onUpdateRow(row.id, 'unit', e.target.value)}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
                      >
                        <option value="Pcs.">Pcs.</option>
                        <option value="Kgs.">Kgs.</option>
                        <option value="Mtr.">Mtr.</option>
                        <option value="Rolls">Rolls</option>
                        <option value="Sets">Sets</option>
                        <option value="Ft.">Ft.</option>
                      </select>
                    </td>

                    {enableListPriceMode && (
                      <>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={row.listPrice}
                            onChange={(e) =>
                              onUpdateRow(row.id, 'listPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right font-semibold text-slate-700 outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={row.discountPercentage}
                            onChange={(e) =>
                              onUpdateRow(
                                row.id,
                                'discountPercentage',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-right font-semibold text-emerald-700 outline-none focus:border-blue-500"
                          />
                        </td>
                      </>
                    )}

                    {/* Cost Price */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={row.costPrice}
                        onChange={(e) =>
                          onUpdateRow(row.id, 'costPrice', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right font-bold text-slate-900 outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Margin % */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.5"
                        value={row.marginPercentage}
                        onChange={(e) =>
                          onUpdateRow(row.id, 'marginPercentage', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 rounded border border-blue-200 bg-blue-50/50 px-2 py-1 text-right font-bold text-blue-700 outline-none focus:border-blue-500"
                        title="Margin % on Cost Price"
                      />
                    </td>

                    {/* Net Price (Interactive input for Case 2) */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={row.price}
                        onChange={(e) =>
                          onUpdateRow(row.id, 'price', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono font-bold text-blue-900 outline-none focus:border-blue-500 focus:bg-blue-50/30"
                        title="Direct Net Price (auto updates Margin %)"
                      />
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                      {formatINR(row.lineTotal)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {row.productId && (
                          <label
                            className="group relative flex items-center cursor-pointer select-none"
                            title={
                              row.updateListPriceInDb
                                ? 'Marked: Will update revised pricing (List, Dis, Cost, Margin) to Catalog DB on save'
                                : 'Update revised pricing to Catalog DB on save'
                            }
                          >
                            <input
                              type="checkbox"
                              checked={!!row.updateListPriceInDb}
                              onChange={(e) =>
                                onUpdateRow(row.id, 'updateListPriceInDb', e.target.checked)
                              }
                              className="peer sr-only"
                            />
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded border transition-all ${
                                row.updateListPriceInDb
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              DB
                            </span>
                          </label>
                        )}
                        {row.productId && onLinkChildToHero && (() => {
                          const linkStatus = isChildLinkEnabled(row.productId, heroProducts, products)
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                if (linkStatus.enabled) {
                                  setAddChildModalTarget(row)
                                }
                              }}
                              disabled={!linkStatus.enabled}
                              className={`p-1 rounded transition-colors ${
                                linkStatus.enabled
                                  ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                                  : 'text-slate-200 cursor-not-allowed opacity-40'
                              }`}
                              title={linkStatus.tooltip}
                            >
                              <Layers className="h-4 w-4" />
                            </button>
                          )
                        })()}
                        <button
                          onClick={() => onRemoveRow(row.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Totals Table Footer - Perfectly Aligned Columns */}
            {estimateRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="py-3.5 px-3 text-left font-black tracking-wider uppercase text-slate-700">
                    Totals c/o
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-black text-blue-700">
                    {summary.totalUnits.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-2 text-center text-slate-500 font-bold text-[11px]">
                    Units
                  </td>
                  {enableListPriceMode && <td colSpan={2}></td>}
                  <td
                    colSpan={3}
                    className="py-3.5 px-3 text-right text-slate-500 font-bold uppercase text-[11px] tracking-wider"
                  >
                    Gross Subtotal:
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-900 text-sm font-black">
                    {formatINR(summary.grossTotal || summary.totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Post-WhatsApp Share Notice Banner */}
        {whatsappSharedNotice && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">Estimate Shared via WhatsApp!</p>
                <p className="text-xs text-emerald-700">
                  Estimate was prepared for <b>{selectedCustomer?.customer_name || 'Customer'}</b>.
                  Ready to start fresh for the next customer?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onClearEstimateDirect}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear & Start Next Estimate</span>
              </button>
              <button
                onClick={onDismissWhatsAppNotice}
                className="rounded-xl border border-emerald-200 bg-white p-2 text-slate-500 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Dismiss notice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Section C: Summary & Action Buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 pt-2">
          {/* Left: Summary Items, Units & Shopkeeper Eyes Only Profit Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                Total Items: <b className="text-slate-900">{summary.itemCount}</b>
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                Total Units: <b className="text-blue-700">{summary.totalUnits.toFixed(2)} Units</b>
              </span>
            </div>

            {/* Shopkeeper Eyes Only Profit Badge */}
            {summary.totalCost > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 px-3 py-1.5 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Est. Profit:
                </span>
                <span className="text-xs font-mono font-black text-emerald-700">
                  {formatINR(summary.totalProfit)}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                  {summary.profitMarginPercentage}% Margin
                </span>
              </div>
            )}
          </div>

          {/* Right: Cash Discount, Estimated Budget & Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Manual Cash Discount Input in Rupees */}
            <div className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-rose-700 whitespace-nowrap">
                Discount (₹):
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={cashDiscount || ''}
                onChange={(e) => onCashDiscountChange?.(parseFloat(e.target.value) || 0)}
                className="w-20 rounded-lg border border-rose-200 bg-white px-2 py-1 text-right font-mono text-xs font-black text-rose-700 outline-none focus:border-rose-400"
                title="Overall discount in Rupees"
              />
            </div>

            {/* Big Total Box */}
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                Estimated Budget
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {formatINR(summary.totalAmount)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onClearEstimate}
                disabled={estimateRows.length === 0}
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Clear all items and start next estimate"
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
                <span>Clear Estimate</span>
              </button>

              <button
                onClick={onOpenPrintSlip}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-600" />
                <span>Print Slip</span>
              </button>

              <button
                onClick={onShareWhatsApp}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                <span>WhatsApp (Free)</span>
              </button>

              <button
                onClick={onSaveEstimate}
                disabled={isSavingQuote || estimateRows.length === 0}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>
                  {isSavingQuote
                    ? isEditing
                      ? 'Updating...'
                      : 'Saving...'
                    : isEditing
                    ? 'Update Estimate'
                    : 'Save Estimate'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Child Component to Hero Product Modal */}
      {onLinkChildToHero && (
        <AddChildToHeroModal
          isOpen={addChildModalTarget !== null}
          onClose={() => setAddChildModalTarget(null)}
          targetRow={addChildModalTarget}
          heroProducts={heroProducts}
          allProducts={products}
          cartRows={estimateRows}
          onLinkChild={onLinkChildToHero}
        />
      )}
    </div>
  )
}
