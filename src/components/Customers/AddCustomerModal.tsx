import React, { useState } from 'react'
import { X, Loader2, Store } from 'lucide-react'

export interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (customerName: string, phone: string, isRetailer?: boolean) => Promise<void>
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isRetailer, setIsRetailer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(name.trim(), phone.trim(), isRetailer)
      setName('')
      setPhone('')
      setIsRetailer(false)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Add New Customer</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Party Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Patel, Kondalu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Retailer / Village Reseller Toggle */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRetailer}
                onChange={(e) => setIsRetailer(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Store className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Village Retailer / Reseller Account</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Enables historical party-wise rate memory in Estimator and protects their estimates from routine cleanups.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Saving...' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
