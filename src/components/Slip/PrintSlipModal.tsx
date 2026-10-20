import React from 'react'
import { Printer, Share2, X } from 'lucide-react'
import type { PrintQuoteData } from '../../types'
import { getWhatsAppShareUrl } from '../../lib/whatsapp'

export interface PrintSlipModalProps {
  isOpen: boolean
  onClose: () => void
  data: PrintQuoteData | null
}

export const PrintSlipModal: React.FC<PrintSlipModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null

  const handleWhatsApp = () => {
    const url = getWhatsAppShareUrl(data)
    window.open(url, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Top Modal Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <span className="font-bold text-slate-800 text-sm">Official Estimate Slip Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Share WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print to Paper</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PHYSICAL RECEIPT REPRODUCTION CONTAINER (MATCHING PHYSICAL PRINTED SLIP) */}
        <div className="overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div
            id="printable-estimate-slip"
            className="w-full max-w-2xl border border-black p-5 font-sans text-black bg-white shadow-sm"
          >
            {/* Top Om Symbol & ESTIMATE title */}
            <div className="flex flex-col items-center justify-center text-center pb-2">
              <div className="text-3xl font-bold leading-none select-none">ॐ</div>
              <div className="text-sm font-black tracking-widest uppercase mt-0.5">ESTIMATE</div>
            </div>

            {/* Header Box: Shop details & Date */}
            <div className="flex justify-between items-start text-xs font-semibold pt-1 pb-2">
              <div>
                <div className="font-bold text-sm tracking-tight uppercase">SRI VENKATESHWARA AND COMPANY</div>
                <div className="uppercase text-slate-800">JAMMIKUNTA</div>
                {data.partyName && (
                  <div className="mt-1 text-[11px] text-slate-700">
                    Party : <span className="font-bold">{data.partyName}</span>
                    {data.phone && <span className="ml-1.5 font-normal">({data.phone})</span>}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold">{data.dated}</div>
                {data.invoiceNo && (
                  <div className="text-[11px] text-slate-700 mt-0.5">
                    No : <span className="font-bold">{data.invoiceNo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Grid Table matching exact physical layout */}
            <table className="w-full border-collapse border border-black text-xs mt-1">
              <thead>
                <tr className="border-b border-black font-bold uppercase text-[11px] bg-slate-50/50">
                  <th className="border border-black py-1 px-1.5 text-center w-10">S.No</th>
                  <th className="border border-black py-1 px-2.5 text-left">Product</th>
                  <th className="border border-black py-1 px-2 text-center w-24">Qty</th>
                  <th className="border border-black py-1 px-2 text-right w-20">Rate</th>
                  <th className="border border-black py-1 px-2 text-right w-24">Amt</th>
                  <th className="border border-black py-1 px-1 text-center w-12">Chk</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it, idx) => (
                  <tr key={it.id || idx} className="border-b border-black">
                    <td className="border border-black py-1 px-1 text-center font-medium">{idx + 1}</td>
                    <td className="border border-black py-1 px-2.5 font-semibold text-slate-900">{it.description}</td>
                    <td className="border border-black py-1 px-2 text-center whitespace-nowrap font-medium">
                      {Number(it.quantity)} {it.unit || 'No'}
                    </td>
                    <td className="border border-black py-1 px-2 text-right font-medium">
                      {Number(it.price).toFixed(2)}
                    </td>
                    <td className="border border-black py-1 px-2 text-right font-bold">
                      {Number(it.lineTotal).toFixed(2)}
                    </td>
                    <td className="border border-black py-1 px-1 text-center">
                      <div className="inline-block h-4 w-4 border border-black rounded-[2px]" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {data.discountAmount && data.discountAmount > 0 ? (
                  <>
                    <tr className="border-t-2 border-black font-semibold text-[11px] bg-slate-50/20">
                      <td colSpan={2} className="border border-black py-1 px-2.5 text-left uppercase font-bold">
                        Subtotal
                      </td>
                      <td className="border border-black py-1 px-2 text-center font-bold">
                        {data.totalUnits.toFixed(2)} Units
                      </td>
                      <td className="border border-black py-1 px-2 text-right uppercase text-[10px] font-bold">
                        Subtotal:
                      </td>
                      <td className="border border-black py-1 px-2 text-right font-bold">
                        {Number(data.grossTotal || (data.totalAmount + data.discountAmount)).toFixed(2)}
                      </td>
                      <td className="border border-black py-1 px-1 text-center" />
                    </tr>
                    <tr className="border-b border-black font-semibold text-[11px]">
                      <td colSpan={3} className="border border-black py-1 px-2.5 text-left">
                        {/* Empty spacer */}
                      </td>
                      <td className="border border-black py-1 px-2 text-right font-bold text-[11px]">
                        Discount:
                      </td>
                      <td className="border border-black py-1 px-2 text-right font-bold text-rose-700">
                        - {Number(data.discountAmount).toFixed(2)}
                      </td>
                      <td className="border border-black py-1 px-1 text-center" />
                    </tr>
                    <tr className="border-t-2 border-black font-bold bg-slate-50/40">
                      <td colSpan={2} className="border border-black py-1.5 px-2.5 text-left uppercase font-black">
                        Total
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center font-black">
                        {data.totalUnits.toFixed(2)} Units
                      </td>
                      <td className="border border-black py-1.5 px-2 text-right uppercase text-[10px] font-black">
                        Net Total:
                      </td>
                      <td className="border border-black py-1.5 px-2 text-right font-black text-sm">
                        {Number(data.totalAmount).toFixed(2)}
                      </td>
                      <td className="border border-black py-1.5 px-1 text-center" />
                    </tr>
                  </>
                ) : (
                  <tr className="border-t-2 border-black font-bold bg-slate-50/30">
                    <td colSpan={2} className="border border-black py-1.5 px-2.5 text-left uppercase">
                      Total
                    </td>
                    <td className="border border-black py-1.5 px-2 text-center font-black">
                      {data.totalUnits.toFixed(2)} Units
                    </td>
                    <td className="border border-black py-1.5 px-2 text-right uppercase text-[10px]">
                      Net Total:
                    </td>
                    <td className="border border-black py-1.5 px-2 text-right font-black text-sm">
                      {Number(data.totalAmount).toFixed(2)}
                    </td>
                    <td className="border border-black py-1.5 px-1 text-center" />
                  </tr>
                )}
              </tfoot>
            </table>

            <div className="mt-3 flex justify-between items-end text-[10px] text-slate-600 pt-2 border-t border-slate-300">
              <div>* Estimates are valid for 3 working days from date of issue.</div>
              <div className="text-right font-semibold">For Sri Venkateshwara And Company</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
