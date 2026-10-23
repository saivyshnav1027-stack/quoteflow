import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  Clock,
  AlertTriangle,
  Pencil,
  Search,
  X,
  Printer,
  ShieldCheck,
  Store,
} from 'lucide-react'
import type { Quotation } from '../../types'
import { formatINR } from '../../lib/pricing'

export interface EstimatesViewProps {
  quotations: Quotation[]
  isLoading?: boolean
  onCreateEstimateClick: () => void
  onViewPrintSlip: (quotation: Quotation) => void
  onEditQuotation?: (quotation: Quotation) => void
  onDeleteQuotation: (quotation: Quotation) => Promise<void> | void
  onPurgeQuotations: (timeline: 'weekly' | 'monthly' | 'all', preserveRetailers?: boolean) => Promise<void> | void
}

export const EstimatesView: React.FC<EstimatesViewProps> = ({
  quotations,
  isLoading = false,
  onCreateEstimateClick,
  onViewPrintSlip,
  onEditQuotation,
  onDeleteQuotation,
  onPurgeQuotations,
}) => {
  const [showPurgeMenu, setShowPurgeMenu] = useState(false)
  const [preserveRetailers, setPreserveRetailers] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'retailers' | 'walkin'>('all')
  const purgeMenuRef = useRef<HTMLDivElement>(null)

  // Segment estimates by customer type
  const retailerQuotes = useMemo(() => quotations.filter((q) => Boolean(q.is_retailer)), [quotations])
  const walkinQuotes = useMemo(() => quotations.filter((q) => !q.is_retailer), [quotations])

  // Filter quotations by search and tab
  const filteredQuotations = useMemo(() => {
    let list = quotations
    if (activeFilter === 'retailers') list = retailerQuotes
    if (activeFilter === 'walkin') list = walkinQuotes

    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter((item) => {
      const matchNo = (item.quotation_number || '').toLowerCase().includes(q)
      const matchCustomer = (item.customer_name || '').toLowerCase().includes(q)
      const matchPhone = (item.phone || '').toLowerCase().includes(q)
      return matchNo || matchCustomer || matchPhone
    })
  }, [quotations, activeFilter, retailerQuotes, walkinQuotes, searchQuery])

  // Click outside to dismiss purge menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (purgeMenuRef.current && !purgeMenuRef.current.contains(event.target as Node)) {
        setShowPurgeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePurgeSelect = (timeline: 'weekly' | 'monthly' | 'all') => {
    setShowPurgeMenu(false)
    onPurgeQuotations(timeline, preserveRetailers)
  }

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Estimates & Quotations
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
              {quotations.length} Saved
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Search, edit, print, and manage all counter estimates and party-wise records
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCreateEstimateClick}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer shadow-blue-500/10 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Estimate</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({quotations.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('retailers')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'retailers'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="h-3.5 w-3.5" />
                <span>Retailers ({retailerQuotes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('walkin')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'walkin'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Walk-Ins ({walkinQuotes.length})
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Real-Time Search Bar */}
            <div className="relative min-w-[280px] sm:min-w-[320px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Customer, Phone, or Est #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Smart Purge / Clean Up Dropdown */}
            <div ref={purgeMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowPurgeMenu(!showPurgeMenu)}
                disabled={quotations.length === 0}
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Clean up old estimates with option to preserve Retailer history"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Clean Up Estimates</span>
                <ChevronDown className="h-3.5 w-3.5 text-rose-500" />
              </button>

              {showPurgeMenu && (
                <div className="absolute right-0 top-11 z-30 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl animate-fade-in">
                  <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-2">
                    Purge Estimates by Timeline
                  </div>

                  {/* Selective Retailer Filter Checkbox */}
                  <div className="mb-3 rounded-xl bg-amber-50/70 border border-amber-200/80 p-2.5">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                      <input
                        type="checkbox"
                        checked={preserveRetailers}
                        onChange={(e) => setPreserveRetailers(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-amber-900 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                          <span>Preserve Retailer Estimates</span>
                        </div>
                        <div className="text-[11px] text-amber-700 mt-0.5 leading-snug">
                          Keeps all regular village reseller quotes safe so historical rate memory is never lost.
                        </div>
                      </div>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePurgeSelect('weekly')}
                    className="w-full flex items-start gap-2.5 rounded-xl p-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Older than 7 Days (Weekly)</div>
                      <div className="text-[11px] text-slate-500">Delete estimate records from last week</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePurgeSelect('monthly')}
                    className="w-full flex items-start gap-2.5 rounded-xl p-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Calendar className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Older than 30 Days (Monthly)</div>
                      <div className="text-[11px] text-slate-500">Delete estimate records older than a month</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => handlePurgeSelect('all')}
                    className="w-full flex items-start gap-2.5 rounded-xl p-2 text-left hover:bg-rose-50 transition-colors cursor-pointer text-rose-700"
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-rose-700">Delete All Matching Estimates</div>
                      <div className="text-[11px] text-rose-500">
                        {preserveRetailers
                          ? 'Delete all Walk-In estimates (Retailers preserved)'
                          : 'Permanently wipe ALL estimate records'}
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4">Est No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Units</th>
                <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="py-3.5 px-4"><div className="h-3.5 bg-slate-100 rounded w-28" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-100 rounded w-12 ml-auto" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-3.5 bg-slate-100 rounded w-20" /></td>
                    <td className="py-3.5 px-4 text-center"><div className="h-7 bg-slate-200 rounded-lg w-28 mx-auto" /></td>
                  </tr>
                ))
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No estimates saved in database yet. Create one from the Estimator tab.
                  </td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">No estimates match your search or filter.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setActiveFilter('all')
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm transition-colors"
                    >
                      Reset Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {item.quotation_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.customer_name}</span>
                        {Boolean(item.is_retailer) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                            <Store className="h-2.5 w-2.5" />
                            <span>Retailer</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {item.phone || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                      {item.total_units}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.total)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewPrintSlip(item)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                          title="View / Print Estimate Slip"
                        >
                          <Printer className="h-3 w-3 text-slate-500" />
                          <span>Slip</span>
                        </button>
                        {onEditQuotation && (
                          <button
                            type="button"
                            onClick={() => onEditQuotation(item)}
                            className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
                            title="Edit this estimate"
                          >
                            <Pencil className="h-3 w-3 text-blue-600" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteQuotation(item)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete this estimate record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
