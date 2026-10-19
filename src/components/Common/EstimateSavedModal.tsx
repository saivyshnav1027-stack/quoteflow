import React from 'react'
import { CheckCircle2, Printer, Share2, Plus, X } from 'lucide-react'
import { formatINR } from '../../lib/pricing'

export interface EstimateSavedModalProps {
  isOpen: boolean
  quotationNumber: string
  customerName: string
  totalAmount: number
  totalUnits: number
  isUpdated?: boolean
  onPrint: () => void
  onWhatsApp: () => void
  onNextEstimate: () => void
  onClose: () => void
}

export const EstimateSavedModal: React.FC<EstimateSavedModalProps> = ({
  isOpen,
  quotationNumber,
  customerName,
  totalAmount,
  totalUnits,
  isUpdated = false,
  onPrint,
  onWhatsApp,
  onNextEstimate,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                {isUpdated ? 'Estimate Updated' : 'Estimate Saved'}
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {isUpdated ? `Estimate #${quotationNumber} Updated!` : `Estimate #${quotationNumber} Recorded!`}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Counter Summary Card */}
        <div className="my-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/80 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Party / Customer</span>
              <div className="text-sm font-bold text-slate-900">{customerName || 'Guest Walk-In'}</div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Quantity</span>
              <div className="text-sm font-black text-blue-700">{totalUnits.toFixed(2)} Units</div>
            </div>
          </div>
          <div className="pt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Payable Total</span>
            <span className="text-2xl font-black text-emerald-600">{formatINR(totalAmount)}</span>
          </div>
        </div>

        {/* Action Prompt */}
        <p className="text-xs font-semibold text-slate-500 mb-4 text-center">
          What would you like to do with this estimate?
        </p>

        {/* 3 Prominent Counter Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4 text-blue-600" />
            <span>Print Slip</span>
          </button>

          <button
            type="button"
            onClick={onWhatsApp}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onNextEstimate}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-3 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Next Estimate</span>
          </button>
        </div>
      </div>
    </div>
  )
}
