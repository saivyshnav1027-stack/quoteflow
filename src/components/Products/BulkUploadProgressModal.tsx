import React from 'react'
import { CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import { formatETA } from '../../lib/catalogImport'

export interface BulkUploadProgressModalProps {
  isOpen: boolean
  currentBatch: number
  totalBatches: number
  totalItems: number
  processedItems: number
  estimatedSecondsLeft: number
  isComplete: boolean
  errorMsg?: string
  onClose: () => void
}

export const BulkUploadProgressModal: React.FC<BulkUploadProgressModalProps> = ({
  isOpen,
  currentBatch,
  totalBatches,
  totalItems,
  processedItems,
  estimatedSecondsLeft,
  isComplete,
  errorMsg,
  onClose,
}) => {
  if (!isOpen) return null

  const progressPercent =
    totalItems > 0 ? Math.min(100, Math.round((processedItems / totalItems) * 100)) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-slate-100">
        {!isComplete ? (
          <div>
            {/* Header */}
            <div className="flex items-center space-x-3 mb-5">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 animate-pulse">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Importing Products...
                </h3>
                <p className="text-xs text-slate-500">
                  Processing in resilient batches of 100
                </p>
              </div>
            </div>

            {/* Error banner if any */}
            {errorMsg && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>
                  Batch {currentBatch} of {totalBatches}
                </span>
                <span className="font-bold text-blue-600 text-sm">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 mb-6 text-center">
              <div>
                <div className="text-[11px] font-medium text-slate-500">Processed Items</div>
                <div className="text-base font-extrabold text-slate-800">
                  {processedItems} / {totalItems}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">Estimated ETA</div>
                <div className="text-base font-extrabold text-blue-700">
                  {formatETA(estimatedSecondsLeft)}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-400">
              Please keep this tab open while catalog records are committed to cloud storage.
            </p>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-4 shadow-sm shadow-emerald-100">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">
              Bulk Upload Complete!
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Successfully processed and synchronized <b>{processedItems}</b> products to the Sri Venkateshwara Trading catalog.
            </p>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-left mb-6 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Total Items Ingested:</span>
                <span className="font-bold text-slate-900">{processedItems}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Batch Executions (100/batch):</span>
                <span className="font-bold text-slate-900">{totalBatches} batches</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Database Status:</span>
                <span className="font-bold text-emerald-700">All Changes Committed</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Return to Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
