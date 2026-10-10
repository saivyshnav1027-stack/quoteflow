import React from 'react'
import {
  Store,
  LayoutDashboard,
  Calculator,
  Package,
  Users,
  SlidersHorizontal,
  Database,
  LogOut,
} from 'lucide-react'
import type { ActivePage } from '../../types'

export interface SidebarProps {
  activePage: ActivePage
  setActivePage: (page: ActivePage) => void
  productCount: number
  customerCount: number
  dbStatus: { isUsingTurso: boolean }
  onLogout: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  productCount,
  customerCount,
  dbStatus,
  onLogout,
}) => {
  return (
    <aside className="no-print flex h-full w-64 flex-col justify-between bg-[#0F172A] text-white shadow-xl">
      <div className="flex flex-col">
        {/* Shop Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-base font-bold tracking-tight text-white">
              Sri Venkateshwara
            </span>
            <span className="truncate text-xs font-medium text-slate-400">Trading & Co.</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 pt-5">
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Operations
          </span>
          <nav className="mt-2 flex flex-col gap-1.5">
            <button
              onClick={() => setActivePage('Dashboard')}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activePage === 'Dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActivePage('Estimator')}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activePage === 'Estimator'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>Estimator (POS)</span>
            </button>

            <button
              onClick={() => setActivePage('Products')}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activePage === 'Products'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Products ({productCount})</span>
            </button>

            <button
              onClick={() => setActivePage('Customers')}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activePage === 'Customers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Customers ({customerCount})</span>
            </button>

            <button
              onClick={() => setActivePage('Settings')}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activePage === 'Settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Admin Settings</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Profile & DB Status */}
      <div className="flex flex-col gap-3 border-t border-slate-800 p-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-medium text-emerald-400">
              {dbStatus.isUsingTurso ? 'Turso Cloud' : 'Local SQLite DB'}
            </span>
          </div>
          <Database className="h-3.5 w-3.5 text-emerald-400" />
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0">
              SK
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-semibold text-white">Shopkeeper</span>
              <span className="truncate text-[10px] text-slate-400">Single User Admin</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
