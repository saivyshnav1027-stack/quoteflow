import React from 'react'
import { Database, ShieldCheck, Loader2 } from 'lucide-react'

export interface AppSplashScreenProps {
  statusMessage?: string
  isDbConnected?: boolean
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  statusMessage = 'Initializing QuoteFlow & Loading Catalog...',
  isDbConnected = true,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none transition-opacity duration-500">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />

      {/* Brand Card */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md px-6">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-600 to-amber-500 blur-lg opacity-40 animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl">
            <span className="text-3xl font-black bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              SVT
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-slate-950 shadow">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black tracking-tight text-white mb-1.5">
          Sri Venkateshwara Trading & Co
        </h1>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
          Hardware, Pipes & Quotation Suite
        </p>

        {/* Spinner & Dynamic Status */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 backdrop-blur-md shadow-lg mb-4">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400 shrink-0" />
          <span className="text-xs font-medium text-slate-300">{statusMessage}</span>
        </div>

        {/* Turso DB Connectivity Badge */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
          <Database className="h-3.5 w-3.5 text-blue-400" />
          <span>Turso Cloud Database:</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            {isDbConnected ? 'Connected (aws-ap-south-1)' : 'Connecting...'}
          </span>
        </div>
      </div>
    </div>
  )
}
