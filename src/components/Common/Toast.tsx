import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  text: string
}

export interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
        }
      case 'error':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
        }
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />,
        }
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          icon: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
        }
    }
  }

  const { bg, icon } = getStyle()

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-md animate-fade-in ${bg}`}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-xs font-bold leading-snug">{toast.text}</span>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
