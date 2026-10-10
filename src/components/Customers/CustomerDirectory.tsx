import React from 'react'
import { Plus } from 'lucide-react'
import type { Customer } from '../../types'

export interface CustomerDirectoryProps {
  customers: Customer[]
  onAddCustomerClick: () => void
  onSelectForEstimate: (customer: Customer) => void
  onDeleteCustomer?: (customer: Customer) => Promise<void> | void
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  customers,
  onAddCustomerClick,
  onSelectForEstimate,
  onDeleteCustomer,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Directory</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Client list, counter walk-ins, and phone records
          </p>
        </div>
        <button
          onClick={onAddCustomerClick}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.customer_name}</td>
                  <td className="py-3 px-4 text-slate-600">{c.phone || 'N/A'}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onSelectForEstimate(c)}
                      className="rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer mr-2"
                    >
                      New Estimate
                    </button>
                    {onDeleteCustomer && (
                      <button
                        onClick={() => onDeleteCustomer(c)}
                        className="rounded p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete customer"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
