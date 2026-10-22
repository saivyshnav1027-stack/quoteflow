import React, { useState } from 'react'
import { AlertOctagon, Trash2, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react'

export interface AdminSettingsViewProps {
  enableListPriceMode: boolean
  onToggleListPriceMode: (enabled: boolean) => void
  onCleanSlatePurge?: () => Promise<void>
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  enableListPriceMode,
  onToggleListPriceMode,
  onCleanSlatePurge,
}) => {
  const [showPurgeModal, setShowPurgeModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [isPurging, setIsPurging] = useState(false)
  const [purgeSuccess, setPurgeSuccess] = useState(false)
  const [purgeError, setPurgeError] = useState('')

  const handleExecutePurge = async () => {
    if (confirmInput.trim() !== 'PURGE ALL DATA') return

    setIsPurging(true)
    setPurgeError('')

    try {
      const res = await fetch('/api/admin/clean-slate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'PURGE_ALL_DATA' }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to execute factory purge')
      }

      setPurgeSuccess(true)
      if (onCleanSlatePurge) {
        await onCleanSlatePurge()
      }
    } catch (err: any) {
      console.error(err)
      setPurgeError(err.message || 'An error occurred during database purge.')
    } finally {
      setIsPurging(false)
    }
  }

  const handleCloseModal = () => {
    setShowPurgeModal(false)
    setConfirmInput('')
    setPurgeSuccess(false)
    setPurgeError('')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Admin Settings & Pricing Modes
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Configure feature flags, pricing calculations, and production data operations for Sri Venkateshwara Trading & Co.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature Flag 1: List Price Mode */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                Pricing Calculation Engine
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  enableListPriceMode
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {enableListPriceMode ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Manufacturer List Price & Trade Discount
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <b>Enabled:</b> Product catalog and Estimator show manufacturer List Price (₹) and Trade
              Discount (%) columns alongside Net Selling Price to derive Cost Price.
              <br />
              <br />
              <b>Disabled (Default):</b> Direct Cost Price counter mode without manufacturer list price and discount overhead.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Toggle Mode:</span>
            <button
              type="button"
              onClick={() => onToggleListPriceMode(!enableListPriceMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enableListPriceMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enableListPriceMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Danger Zone: Clean-Slate Factory Reset */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-rose-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 flex items-center space-x-1.5">
                <AlertOctagon className="h-3.5 w-3.5" />
                <span>Production Handoff</span>
              </span>
              <span className="text-xs font-mono font-bold text-rose-700">
                DANGER ZONE
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Clean-Slate Factory Reset
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Wipes all demo and mock data: <b>Products</b>, <b>Customers</b>, <b>Quotations</b>, and <b>Hero Accessory Mappings</b> from the database.
              <br />
              <br />
              Use this before handing the counter terminal to the business owner so they start with a completely empty, pristine database to bulk import their authentic hardware inventory.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-rose-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Wipe All Records:</span>
            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-500/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Purge All Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            {!purgeSuccess ? (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      Confirm Factory Reset
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This will permanently delete <b>all products, customers, quotations, and hero bundles</b>. This action <b>cannot</b> be undone.
                  </p>

                  {purgeError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                      {purgeError}
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Type <span className="font-mono text-rose-600 font-extrabold">PURGE ALL DATA</span> to confirm:
                    </label>
                    <input
                      type="text"
                      placeholder="PURGE ALL DATA"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={confirmInput.trim() !== 'PURGE ALL DATA' || isPurging}
                    onClick={handleExecutePurge}
                    className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      confirmInput.trim() === 'PURGE ALL DATA' && !isPurging
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 cursor-pointer active:scale-[0.98]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isPurging ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Purging Database...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Purge & Reset All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Database Wiped Clean!
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  All demo products, customers, quotes, and bundle mappings have been removed. The terminal is clean and ready for your first bulk upload.
                </p>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
