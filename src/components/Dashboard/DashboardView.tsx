import React, { useMemo } from 'react'
import {
  Calculator,
  Receipt,
  Package,
  TrendingUp,
  Store,
  ArrowRight,
  Printer,
  ChevronRight,
} from 'lucide-react'
import type { Quotation, Product, Customer } from '../../types'
import { formatINR } from '../../lib/pricing'

export interface DashboardViewProps {
  quotations: Quotation[]
  products: Product[]
  customers: Customer[]
  onCreateEstimateClick: () => void
  onNavigateToEstimates: () => void
  onNavigateToProducts: () => void
  onNavigateToCustomers: () => void
  onViewPrintSlip: (quotation: Quotation) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotations,
  products,
  customers,
  onCreateEstimateClick,
  onNavigateToEstimates,
  onNavigateToProducts,
  onNavigateToCustomers,
  onViewPrintSlip,
}) => {
  // Today's metrics
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayQuotes = useMemo(() => {
    return quotations.filter((q) => q.created_at && q.created_at.startsWith(todayStr))
  }, [quotations, todayStr])

  const todayVolume = useMemo(() => {
    return todayQuotes.reduce((acc, q) => acc + (Number(q.total) || 0), 0)
  }, [todayQuotes])

  // Retailers count
  const retailerCount = useMemo(() => {
    return customers.filter((c) => Boolean(c.is_retailer)).length
  }, [customers])

  // Recent 5 estimates
  const recentQuotes = useMemo(() => {
    return quotations.slice(0, 5)
  }, [quotations])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-300 mb-3">
              <Store className="h-3.5 w-3.5" />
              <span>Wholesale Depot & Agro-Trading Counter</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Sri Venkateshwara Trading & Co.
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Wholesale distribution counter for village retailers and electrical resellers. Real-time party-wise pricing and instant estimate generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCreateEstimateClick}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Calculator className="h-4 w-4" />
              <span>New Estimate (POS)</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToEstimates}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-xs border border-white/10 transition-all cursor-pointer"
            >
              <Receipt className="h-4 w-4" />
              <span>View All Estimates</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Volume */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Sales Volume</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {formatINR(todayVolume)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span>{todayQuotes.length} estimate(s) generated today</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Estimates */}
        <div 
          onClick={onNavigateToEstimates}
          className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Estimates</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {quotations.length}
            </div>
            <div className="text-xs text-blue-600 font-bold mt-1 flex items-center gap-0.5">
              <span>Open estimates register</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Card 3: Retailers & Resellers */}
        <div 
          onClick={onNavigateToCustomers}
          className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Village Resellers</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {retailerCount} <span className="text-sm font-normal text-slate-400">/ {customers.length}</span>
            </div>
            <div className="text-xs text-indigo-600 font-bold mt-1 flex items-center gap-0.5">
              <span>Retailer pricing active</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Card 4: Hardware Catalog */}
        <div 
          onClick={onNavigateToProducts}
          className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Inventory</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {products.length} <span className="text-sm font-normal text-slate-400">SKUs</span>
            </div>
            <div className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
              <span>View master price list</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Counter Estimates Table */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Counter Estimates</h3>
            <p className="text-xs text-slate-500">Most recent quotes given at the counter</p>
          </div>
          <button
            type="button"
            onClick={onNavigateToEstimates}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <span>View Full Register</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            No estimates recorded yet. Start billing with <b>New Estimate (POS)</b>.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-2.5 px-4">Est No</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4 text-right">Items / Units</th>
                  <th className="py-2.5 px-4 text-right">Total Amount (₹)</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-center">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {recentQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {q.quotation_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{q.customer_name}</span>
                        {Boolean(q.is_retailer) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                            <Store className="h-2.5 w-2.5" />
                            <span>Retailer</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {q.total_units} pcs
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(q.total)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(q.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onViewPrintSlip(q)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                        title="Print Estimate Slip"
                      >
                        <Printer className="h-3 w-3 text-slate-500" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
