import React, { useState } from 'react'
import { AlertOctagon, Trash2, CheckCircle2, AlertTriangle, X, Loader2, Sparkles } from 'lucide-react'
import type { PricingSuperiorityMode } from '../../types'

export interface AdminSettingsViewProps {
  enableListPriceMode: boolean
  onToggleListPriceMode: (enabled: boolean) => void
  pricingSuperiorityMode?: PricingSuperiorityMode
  onTogglePricingSuperiority?: (mode: PricingSuperiorityMode) => void
  onCleanSlatePurge?: () => Promise<void>
  onPurgeQa?: () => Promise<void>
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  enableListPriceMode,
  onToggleListPriceMode,
  pricingSuperiorityMode = 'PRICE',
  onTogglePricingSuperiority,
  onCleanSlatePurge,
  onPurgeQa,
}) => {
  const [showPurgeModal, setShowPurgeModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [isPurging, setIsPurging] = useState(false)
  const [purgeSuccess, setPurgeSuccess] = useState(false)
  const [purgeError, setPurgeError] = useState('')

  // QA Purge state
  const [showQaPurgeModal, setShowQaPurgeModal] = useState(false)
  const [isPurgingQa, setIsPurgingQa] = useState(false)
  const [qaPurgeCount, setQaPurgeCount] = useState<number | null>(null)
  const [qaPurgeError, setQaPurgeError] = useState('')

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

  const handleExecuteQaPurge = async () => {
    setIsPurgingQa(true)
    setQaPurgeError('')
    try {
      const res = await fetch('/api/products?action=purge-qa', {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || 'Failed to purge QA test records')
      }
      setQaPurgeCount(data.deletedCount ?? 0)
      if (onPurgeQa) {
        await onPurgeQa()
      }
    } catch (err: any) {
      console.error(err)
      setQaPurgeError(err.message || 'An error occurred during QA purge.')
    } finally {
      setIsPurgingQa(false)
    }
  }

  const handleCloseQaModal = () => {
    setShowQaPurgeModal(false)
    setQaPurgeCount(null)
    setQaPurgeError('')
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

        {/* Feature Flag 2: Pricing Calculation Superiority Mode */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>Calculation Engine Priority</span>
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  pricingSuperiorityMode === 'PRICE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {pricingSuperiorityMode === 'PRICE' ? '₹ AMOUNTS SUPERIOR' : '% PERCENTAGES SUPERIOR'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Calculation Superiority Priority
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Determines which values are treated as sacred ground truth during catalog entry and estimator price recalculations:
            </p>

            <div className="mt-3 space-y-2">
              <div
                onClick={() => onTogglePricingSuperiority && onTogglePricingSuperiority('PRICE')}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  pricingSuperiorityMode === 'PRICE'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500 text-slate-800'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="font-extrabold flex items-center justify-between text-slate-900">
                  <span>₹ Rupee Amounts Superior (Cost & Net Price)</span>
                  {pricingSuperiorityMode === 'PRICE' && (
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">Active</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Cost Price (₹) and Net Price (₹) remain fixed. Automatically calculates Trade Discount % and Margin %, preventing counter penny roundoff shifts.
                </div>
              </div>

              <div
                onClick={() => onTogglePricingSuperiority && onTogglePricingSuperiority('PERCENTAGE')}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  pricingSuperiorityMode === 'PERCENTAGE'
                    ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500 text-slate-800'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="font-extrabold flex items-center justify-between text-slate-900">
                  <span>% Percentages Superior (Trade Dis% & Margin%)</span>
                  {pricingSuperiorityMode === 'PERCENTAGE' && (
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">Active</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Trade Discount % and Margin % remain locked. Cost Price and Net Price automatically recompute when manufacturer list prices change.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Superior Value:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => onTogglePricingSuperiority && onTogglePricingSuperiority('PRICE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pricingSuperiorityMode === 'PRICE'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ Amounts
              </button>
              <button
                type="button"
                onClick={() => onTogglePricingSuperiority && onTogglePricingSuperiority('PERCENTAGE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pricingSuperiorityMode === 'PERCENTAGE'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                % Percentages
              </button>
            </div>
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

        {/* Maintenance: QA Test Records Purge */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-amber-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 flex items-center space-x-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Test Data Management</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-700">
                SAFE PURGE
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Purge QA Test Records
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Safely deletes only products created for testing (prefix <b>QA_*</b>) and their references in quotations and bundles.
              <br />
              <br />
              <b>Genuine stock catalog items, customers, and active production estimates remain untouched.</b>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Clear QA Products:</span>
            <button
              type="button"
              onClick={() => setShowQaPurgeModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm shadow-amber-500/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Purge QA Products</span>
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

      {/* QA Purge Modal */}
      {showQaPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            {qaPurgeCount === null ? (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      Purge QA Test Records
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseQaModal}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This will delete all test items with code or name starting with <b className="text-amber-700 font-mono">QA_*</b>. Real products will not be affected.
                  </p>

                  {qaPurgeError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                      {qaPurgeError}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseQaModal}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPurgingQa}
                    onClick={handleExecuteQaPurge}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 cursor-pointer active:scale-[0.98]"
                  >
                    {isPurgingQa ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Purging QA Items...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Confirm Purge QA</span>
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
                  QA Records Purged!
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  Successfully removed {qaPurgeCount} QA test product(s). Your genuine hardware catalog is clean and ready.
                </p>
                <button
                  type="button"
                  onClick={handleCloseQaModal}
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
