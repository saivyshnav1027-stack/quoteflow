import React from 'react'
import { CheckCircle2, Database, X } from 'lucide-react'
import { formatINR } from '../../lib/pricing'

export interface CatalogUpdateSummaryItem {
  productId: number
  productName: string
  listPrice: number
  discountPercentage: number
  costPrice: number
  marginPercentage: number
}

export interface CatalogSyncSuccessModalProps {
  isOpen: boolean
  items: CatalogUpdateSummaryItem[]
  onClose: () => void
}

export const CatalogSyncSuccessModal: React.FC<CatalogSyncSuccessModalProps> = ({
  isOpen,
  items,
  onClose,
}) => {
  if (!isOpen || items.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-emerald-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                  Turso Cloud DB Synchronized
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {items.length} Product{items.length > 1 ? 's' : ''} Updated
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                Master Catalog Prices Updated
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-600 leading-relaxed">
          The following product pricing parameters have been permanently committed to the cloud database and will automatically apply to all future quotations:
        </p>

        {/* Itemized Table */}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 text-[11px]">
                <th className="py-2.5 px-3">Product Description</th>
                <th className="py-2.5 px-3 text-right">List Price</th>
                <th className="py-2.5 px-3 text-right">Trade Dis%</th>
                <th className="py-2.5 px-3 text-right">Cost Price</th>
                <th className="py-2.5 px-3 text-right">Margin%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {items.map((it) => (
                <tr key={it.productId} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{it.productName}</td>
                  <td className="py-2.5 px-3 text-right font-bold">{formatINR(it.listPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                    {it.discountPercentage}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                    {formatINR(it.costPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                      +{it.marginPercentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Understood & Done</span>
          </button>
        </div>
      </div>
    </div>
  )
}
