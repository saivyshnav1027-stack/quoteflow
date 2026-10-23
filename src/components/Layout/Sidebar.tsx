import React from 'react'
import {
  Store,
  LayoutDashboard,
  Calculator,
  Receipt,
  Package,
  Users,
  SlidersHorizontal,
  Database,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react'
import type { ActivePage } from '../../types'

export interface SidebarProps {
  activePage: ActivePage
  setActivePage: (page: ActivePage) => void
  productCount: number
  customerCount: number
  heroProductCount?: number
  quotationsCount?: number
  dbStatus: { isUsingTurso: boolean }
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  productCount,
  customerCount,
  heroProductCount,
  quotationsCount,
  dbStatus,
  isOpen,
  onClose,
  onLogout,
}) => {
  const handleNavClick = (page: ActivePage) => {
    setActivePage(page)
    onClose()
  }

  return (
    <>
      {/* Backdrop for floating drawer */}
      {isOpen && (
        <div
          className="no-print fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Floating Sidebar Drawer */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col justify-between bg-[#0F172A] text-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main Navigation"
      >
        <div className="flex flex-col">
          {/* Shop Header & Close Button */}
          <div className="flex items-center justify-between border-b border-slate-800 p-5">
            <div className="flex items-center gap-3 min-w-0">
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
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="px-3 pt-5">
            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Operations & Sales
            </span>
            <nav className="mt-2 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleNavClick('Dashboard')}
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
                type="button"
                onClick={() => handleNavClick('Estimator')}
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
                type="button"
                onClick={() => handleNavClick('Estimates')}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  activePage === 'Estimates'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Receipt className="h-4 w-4" />
                  <span>Estimates History</span>
                </div>
                {quotationsCount !== undefined && quotationsCount > 0 && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">
                    {quotationsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('Products')}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  activePage === 'Products'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4" />
                  <span>Products</span>
                </div>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">
                  {productCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('HeroProducts')}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  activePage === 'HeroProducts'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Hero Products</span>
                </div>
                {heroProductCount !== undefined && heroProductCount > 0 && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-amber-400">
                    {heroProductCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('Customers')}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  activePage === 'Customers'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  <span>Customers</span>
                </div>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">
                  {customerCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('Settings')}
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
                <span className="truncate text-xs font-semibold text-white">Owner</span>
                <span className="truncate text-[10px] text-slate-400">Single User Admin</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
