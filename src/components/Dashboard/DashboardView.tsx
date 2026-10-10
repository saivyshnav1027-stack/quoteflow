import React from 'react'
import { Plus } from 'lucide-react'
import type { Quotation } from '../../types'
import { formatINR } from '../../lib/pricing'

export interface DashboardViewProps {
  quotations: Quotation[]
  onCreateEstimateClick: () => void
  onViewPrintSlip: (quotation: Quotation) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotations,
  onCreateEstimateClick,
  onViewPrintSlip,
}) => {
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

      {/* Quotations History Table */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Recent Estimate History</h3>
          <span className="text-xs text-slate-500 font-semibold">{quotations.length} records</span>
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
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No estimates generated yet. Create one from the Estimator tab.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
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
                      <button
                        onClick={() => onViewPrintSlip(q)}
                        className="rounded bg-slate-100 px-3 py-1 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                      >
                        View / Print
                      </button>
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
