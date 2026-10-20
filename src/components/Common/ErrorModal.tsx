import React, { useState } from 'react'
import { Printer, RefreshCw, Copy, Check, X, ShieldAlert } from 'lucide-react'

export interface ErrorModalProps {
  isOpen: boolean
  title: string
  message: string
  errorCode?: string
  rawError?: string
  canEmergencyPrint?: boolean
  canRetry?: boolean
  backupData?: any
  onEmergencyPrint?: () => void
  onRetry?: () => Promise<void> | void
  onClose: () => void
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  title,
  message,
  errorCode = 'ERR_CLOUD_SYNC',
  rawError,
  canEmergencyPrint = false,
  canRetry = false,
  backupData,
  onEmergencyPrint,
  onRetry,
  onClose,
}) => {
  const [copied, setCopied] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    try {
      const textToCopy = backupData
        ? JSON.stringify(backupData, null, 2)
        : `Error: ${title}\nMessage: ${message}\nDetails: ${rawError || 'N/A'}`
      navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  const handleRetry = async () => {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-rose-100">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">
                {errorCode}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed whitespace-pre-line">{message}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Emergency offline print callout */}
        {canEmergencyPrint && (
          <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
              <Printer className="h-4 w-4 text-amber-700" />
              <span>Don't keep the customer waiting!</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
              Your entered estimate is intact locally. You can immediately open and print the physical bill slip for the customer while cloud synchronization is retried.
            </p>
            {onEmergencyPrint && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEmergencyPrint()
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Emergency Print Bill Now</span>
              </button>
            )}
          </div>
        )}

        {/* Raw diagnostic drawer */}
        {rawError && (
          <details className="mt-3 text-[11px] text-slate-500 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            <summary className="font-semibold cursor-pointer text-slate-600 hover:text-slate-900">
              Technical Details & Diagnostics
            </summary>
            <pre className="mt-2 text-[10px] text-rose-700 font-mono bg-white p-2 rounded border border-rose-100 overflow-x-auto whitespace-pre-wrap">
              {rawError}
            </pre>
          </details>
        )}

        {/* Action Footer */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Copy estimate backup to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Data Backup'}</span>
          </button>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
            {canRetry && onRetry && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Retrying...' : 'Retry Cloud Sync'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
