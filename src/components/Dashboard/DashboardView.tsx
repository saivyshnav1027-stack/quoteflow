import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, Trash2, Calendar, ChevronDown, Clock, AlertTriangle, Pencil, Search, X } from 'lucide-react'
import type { Quotation } from '../../types'
import { formatINR } from '../../lib/pricing'

export interface DashboardViewProps {
  quotations: Quotation[]
  onCreateEstimateClick: () => void
  onViewPrintSlip: (quotation: Quotation) => void
  onEditQuotation?: (quotation: Quotation) => void
  onDeleteQuotation: (quotation: Quotation) => Promise<void> | void
  onPurgeQuotations: (timeline: 'weekly' | 'monthly' | 'all') => Promise<void> | void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotations,
  onCreateEstimateClick,
  onViewPrintSlip,
  onEditQuotation,
  onDeleteQuotation,
  onPurgeQuotations,
}) => {
  const [showPurgeMenu, setShowPurgeMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const purgeMenuRef = useRef<HTMLDivElement>(null)

  // Filter quotations by customer name, phone, or quotation number
  const filteredQuotations = useMemo(() => {
    if (!searchQuery.trim()) return quotations
    const q = searchQuery.toLowerCase().trim()
    return quotations.filter((item) => {
      const matchNo = (item.quotation_number || '').toLowerCase().includes(q)
      const matchCustomer = (item.customer_name || '').toLowerCase().includes(q)
      const matchPhone = (item.phone || '').toLowerCase().includes(q)
      return matchNo || matchCustomer || matchPhone
    })
  }, [quotations, searchQuery])

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
    onPurgeQuotations(timeline)
  }

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quotations & Estimates
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Recent estimate records and counter operations
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onCreateEstimateClick}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Estimate</span>
          </button>
        </div>
      </div>

      {/* Quotations History Table Card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Estimate History</h3>
            <span className="text-xs text-slate-500 font-semibold">
              {searchQuery.trim()
                ? `Showing ${filteredQuotations.length} of ${quotations.length} estimates`
                : `${quotations.length} records in database`}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Real-Time Search Bar */}
            <div className="relative min-w-[280px] sm:min-w-[340px]">
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

            {/* Purge / Timeline Delete Dropdown */}
            <div ref={purgeMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowPurgeMenu(!showPurgeMenu)}
                disabled={quotations.length === 0}
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Delete estimates based on weekly or monthly timeline"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Clean Up / Delete</span>
                <ChevronDown className="h-3.5 w-3.5 text-rose-500" />
              </button>

            {showPurgeMenu && (
              <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  Purge Estimates by Timeline
                </div>

                <button
                  onClick={() => handlePurgeSelect('weekly')}
                  className="w-full flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Older than 7 Days (Weekly)</div>
                    <div className="text-[11px] text-slate-500">Delete estimate records from last week</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePurgeSelect('monthly')}
                  className="w-full flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Calendar className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Older than 30 Days (Monthly)</div>
                    <div className="text-[11px] text-slate-500">Delete estimate records older than a month</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => handlePurgeSelect('all')}
                  className="w-full flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-rose-50 transition-colors cursor-pointer text-rose-700"
                >
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-rose-700">Delete All Estimates</div>
                    <div className="text-[11px] text-rose-500">Permanently wipe all quotation history</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No estimates saved in database yet. Create one from the Estimator tab.
                  </td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">No estimates match your search "{searchQuery}"</p>
                    <p className="text-xs text-slate-400 mt-1">Check for typos or search by another customer name or phone number.</p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm transition-colors"
                    >
                      Clear Search
                    </button>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-700">{q.quotation_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{q.customer_name}</td>
                    <td className="py-3 px-4 text-slate-500">{q.phone || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">
                      {Number(q.total_units || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatINR(q.total)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(q.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onEditQuotation && (
                          <button
                            onClick={() => onEditQuotation(q)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 font-bold text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors"
                            title="Edit this estimate in Estimator"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => onViewPrintSlip(q)}
                          className="rounded-lg bg-slate-100 px-3 py-1 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
                        >
                          View / Print
                        </button>
                        <button
                          onClick={() => onDeleteQuotation(q)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete estimate from database"
                        >
                          <Trash2 className="h-4 w-4" />
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
