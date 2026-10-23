import React, { useState, useMemo } from 'react'
import { Plus, Store, Search, X, Trash2, ArrowUpRight } from 'lucide-react'
import type { Customer } from '../../types'

export interface CustomerDirectoryProps {
  customers: Customer[]
  onAddCustomerClick: () => void
  onSelectForEstimate: (customer: Customer) => void
  onToggleRetailer?: (customer: Customer) => Promise<void> | void
  onDeleteCustomer?: (customer: Customer) => Promise<void> | void
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  customers,
  onAddCustomerClick,
  onSelectForEstimate,
  onToggleRetailer,
  onDeleteCustomer,
}) => {
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'retailers' | 'regular'>('all')

  const retailerCustomers = useMemo(() => customers.filter((c) => Boolean(c.is_retailer)), [customers])
  const regularCustomers = useMemo(() => customers.filter((c) => !c.is_retailer), [customers])

  const filteredCustomers = useMemo(() => {
    let list = customers
    if (filterTab === 'retailers') list = retailerCustomers
    if (filterTab === 'regular') list = regularCustomers

    if (!search.trim()) return list
    const q = search.toLowerCase().trim()
    return list.filter((c) => {
      const matchName = (c.customer_name || '').toLowerCase().includes(q)
      const matchPhone = (c.phone || '').toLowerCase().includes(q)
      return matchName || matchPhone
    })
  }, [customers, filterTab, retailerCustomers, regularCustomers, search])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Directory</h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
              {customers.length} Accounts
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Village retailers, regular electrical contractors, and counter phone records
          </p>
        </div>
        <button
          type="button"
          onClick={onAddCustomerClick}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('retailers')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterTab === 'retailers'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Retailers ({retailerCustomers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('regular')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterTab === 'regular'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Regular ({regularCustomers.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4">Party / Customer Name</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No customers match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {c.customer_name}
                    </td>
                    <td className="py-3 px-4">
                      {Boolean(c.is_retailer) ? (
                        <button
                          type="button"
                          onClick={() => onToggleRetailer && onToggleRetailer(c)}
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Click to toggle account type"
                        >
                          <Store className="h-3 w-3" />
                          <span>Village Retailer</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleRetailer && onToggleRetailer(c)}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Click to toggle account type"
                        >
                          <span>Regular / Walk-In</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {c.phone || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectForEstimate(c)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
                        >
                          <span>New Estimate</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                        {onDeleteCustomer && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomer(c)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete customer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
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
