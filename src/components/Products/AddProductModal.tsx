import React, { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

export interface NewProductData {
  productName: string
  productCode: string
  unit: string
  listPrice: number
  discountPercentage: number
  costPrice: number
  marginPercentage: number
}

export interface AddProductModalProps {
  isOpen: boolean
  enableListPriceMode: boolean
  initialName?: string
  showAddToQuoteOption?: boolean
  onClose: () => void
  onSave: (productData: NewProductData, addToQuote: boolean) => Promise<void>
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  enableListPriceMode,
  initialName = '',
  showAddToQuoteOption = true,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [unit, setUnit] = useState('Pcs.')
  const [listPrice, setListPrice] = useState<number | ''>('')
  const [discountPercentage, setDiscountPercentage] = useState<number | ''>('')
  const [costPrice, setCostPrice] = useState<number | ''>('')
  const [marginPercentage, setMarginPercentage] = useState<number | ''>(15)
  const [submittingAction, setSubmittingAction] = useState<'catalog' | 'quote' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (initialName) setName(initialName)
      setErrorMsg('')
    }
  }, [isOpen, initialName])

  if (!isOpen) return null

  const handleSave = async (addToQuote: boolean) => {
    if (!name.trim()) {
      setErrorMsg('Please enter product description/name.')
      return
    }
    setErrorMsg('')

    setSubmittingAction(addToQuote ? 'quote' : 'catalog')
    try {
      await onSave(
        {
          productName: name.trim(),
          productCode: code.trim(),
          unit,
          listPrice: Number(listPrice || 0),
          discountPercentage: Number(discountPercentage || 0),
          costPrice: Number(costPrice || 0),
          marginPercentage: Number(marginPercentage || 15),
        },
        addToQuote
      )
      setName('')
      setCode('')
      setUnit('Pcs.')
      setListPrice('')
      setDiscountPercentage('')
      setCostPrice('')
      setMarginPercentage(15)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingAction(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSave(showAddToQuoteOption)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Add New Product to Catalog</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {errorMsg && (
          <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-700 animate-fade-in">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description of Goods *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ashirwad 3/4 CPVC Pipe, Steel Sink, FRP Chamber"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Code / SKU
              </label>
              <input
                type="text"
                placeholder="Auto-generated if empty"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="Pcs.">Pcs.</option>
                <option value="Kgs.">Kgs.</option>
                <option value="Mtr.">Mtr.</option>
                <option value="Rolls">Rolls</option>
                <option value="Sets">Sets</option>
                <option value="Ft.">Ft.</option>
              </select>
            </div>
          </div>

          {enableListPriceMode ? (
            <div className="grid grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">List (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="462.00"
                  value={listPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || ''
                    setListPrice(val)
                    const listNum = typeof val === 'number' ? val : 0
                    const disNum = typeof discountPercentage === 'number' ? discountPercentage : 0
                    if (listNum > 0) {
                      setCostPrice(Number((listNum * (1 - disNum / 100)).toFixed(2)))
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trade Dis%</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="54.00"
                  value={discountPercentage}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || ''
                    setDiscountPercentage(val)
                    const listNum = typeof listPrice === 'number' ? listPrice : 0
                    const disNum = typeof val === 'number' ? val : 0
                    if (listNum > 0) {
                      setCostPrice(Number((listNum * (1 - disNum / 100)).toFixed(2)))
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold text-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Auto"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || '')}
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 text-slate-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Margin%</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="15"
                  value={marginPercentage}
                  onChange={(e) => setMarginPercentage(parseFloat(e.target.value) || '')}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold text-blue-700"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cost Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="175.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || '')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Margin (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="15"
                  value={marginPercentage}
                  onChange={(e) => setMarginPercentage(parseFloat(e.target.value) || '')}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2 text-sm outline-none focus:border-blue-500 font-bold text-blue-700"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submittingAction !== null}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={submittingAction !== null}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submittingAction === 'catalog' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{submittingAction === 'catalog' ? 'Saving...' : 'Save to Catalog'}</span>
            </button>
            {showAddToQuoteOption && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={submittingAction !== null}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submittingAction === 'quote' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{submittingAction === 'quote' ? 'Adding...' : 'Save & Add to Quote'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
