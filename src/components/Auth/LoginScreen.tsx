import React, { useState } from 'react'
import {
  Store,
  AlertCircle,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export interface LoginScreenProps {
  onLogin: () => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('+91 98480 12345')
  const [pin, setPin] = useState('1234')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      setError('Please enter Mobile Number or Shopkeeper ID')
      return
    }
    if (!pin.trim()) {
      setError('Please enter Security PIN')
      return
    }
    onLogin()
  }

  const handleDemoLogin = () => {
    setPhone('+91 98480 12345')
    setPin('1234')
    onLogin()
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="rounded-3xl bg-slate-900/95 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 mb-4">
              <Store className="h-8 w-8" />
            </div>
            <div className="inline-block rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2">
              Wholesale Depot & Agro-Trading Hub
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Sri Venkateshwara Trading & Co.
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Counter POS Estimator & Inventory Management Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Shopkeeper Mobile / User ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98480 12345 or admin"
                  className="w-full rounded-xl bg-slate-800/80 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Security PIN / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN (default: 1234)"
                  className="w-full rounded-xl bg-slate-800/80 border border-slate-700 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800/90 border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Quick Demo Access (1-Click)</span>
              </button>
            </div>
          </form>

          {/* Quick info badges */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400 text-center">
            <div className="rounded-lg bg-slate-800/50 p-2">
              <span className="font-semibold text-emerald-400 block">☁️ Turso Cloud Sync</span>
              <span>Centralized Pricing</span>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-2">
              <span className="font-semibold text-blue-400 block">📄 Physical Slip Ready</span>
              <span>Physical POS Format</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-slate-500">
          Sri Venkateshwara Trading & Co. • Agro & Hardware Operations
        </div>
      </div>
    </div>
  )
}
