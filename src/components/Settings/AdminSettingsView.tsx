import React from 'react'

export interface AdminSettingsViewProps {
  enableListPriceMode: boolean
  enableFlatRupeeDiscount: boolean
  enablePriceAfterMargin: boolean
  onToggleListPriceMode: (enabled: boolean) => void
  onToggleFlatRupeeDiscount: (enabled: boolean) => void
  onTogglePriceAfterMargin: (enabled: boolean) => void
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  enableListPriceMode,
  enableFlatRupeeDiscount,
  enablePriceAfterMargin,
  onToggleListPriceMode,
  onToggleFlatRupeeDiscount,
  onTogglePriceAfterMargin,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Admin Settings & Pricing Modes
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Configure feature flags and counter pricing behaviors for Sri Venkateshwara Trading & Co.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Feature Flag 1: List Price Mode */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                Feature Flag 1
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
              <b>Enabled:</b> Product catalog and Estimator show manufacturer List Price and Trade
              Discount % columns to derive Cost Price.
              <br />
              <br />
              <b>Disabled (Default):</b> Direct Cost Price counter mode without list price and
              manufacturer discount overhead.
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

        {/* Feature Flag 2: Flat Rupee Cash Discount */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                Feature Flag 2
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  enableFlatRupeeDiscount
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {enableFlatRupeeDiscount ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Flat Rupee (₹) Discount Round-off</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <b>Enabled (Default):</b> Allows switching line item customer discounts between
              percentage (%) and flat rupee (₹) cash discounts for quick customer bill round-offs.
              <br />
              <br />
              <b>Disabled:</b> Discounts are strictly percentage (%) based.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Toggle Mode:</span>
            <button
              type="button"
              onClick={() => onToggleFlatRupeeDiscount(!enableFlatRupeeDiscount)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enableFlatRupeeDiscount ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enableFlatRupeeDiscount ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Feature Flag 3: Price + Margin Column */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                Feature Flag 3
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  enablePriceAfterMargin
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {enablePriceAfterMargin ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Price + Margin Column Display</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <b>Enabled:</b> Displays the intermediate "Price + Margin" breakdown column in the POS table
              to inspect markup before customer discount.
              <br />
              <br />
              <b>Disabled (Default):</b> Hides the Price + Margin column to keep the POS counter table
              streamlined and focused directly on Net Price & Amount.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Toggle Mode:</span>
            <button
              type="button"
              onClick={() => onTogglePriceAfterMargin(!enablePriceAfterMargin)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enablePriceAfterMargin ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enablePriceAfterMargin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
