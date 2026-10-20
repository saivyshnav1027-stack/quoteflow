import type { EstimateRow } from '../types'

/**
 * Format currency amounts in standard Indian Rupee notation (e.g. ₹1,800.00)
 */
export const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0)
}

/**
 * Pure calculation function for an individual estimate row.
 * Formula strictly aligns with live spreadsheet:
 * 1. Cost Price = derived from List * (1 - TradeDis/100) if ListPriceMode is ON, else direct Cost Price.
 * 2. Price After Margin = Cost Price * (1 + Margin% / 100)
 * 3. Net Price = Price After Margin * (1 - Dis% / 100) [or flat ₹ Dis]
 * 4. Line Total = Qty * Net Price
 */
export const calculateRow = (row: EstimateRow, enableListPriceMode = false): EstimateRow => {
  let cost = Number(row.costPrice || 0)
  const list = Number(row.listPrice || 0)
  const tradeDis = Number(row.discountPercentage || 0)

  // In List Price mode, cost price is derived from List Price * (1 - Trade Dis / 100)
  if (enableListPriceMode && list > 0) {
    cost = Number((list * (1 - tradeDis / 100)).toFixed(2))
  }

  const marginPct = Number(row.marginPercentage ?? 15)
  // Formula: Net Price = Cost Price * (1 + Margin / 100)
  const netPrice = Number((cost * (1 + marginPct / 100)).toFixed(2))

  const qty = Number(row.quantity || 0)
  const lineTotal = Number((netPrice * qty).toFixed(2))

  return {
    ...row,
    costPrice: cost,
    marginPercentage: marginPct,
    discount: 0,
    price: netPrice,
    lineTotal,
  }
}

export interface EstimateTotals {
  itemCount: number
  totalUnits: number
  totalAmount: number
  baseListSum: number
  totalSavings: number
}

/**
 * Pure calculation of aggregated units and total sum across all estimate rows.
 * Total amount is rounded up to the next whole rupee using Math.ceil (e.g. ₹1952.30 -> ₹1953.00)
 */
export const calculateTotals = (rows: EstimateRow[]): EstimateTotals => {
  let totalUnits = 0
  let rawTotalAmount = 0
  let baseListSum = 0

  rows.forEach((r) => {
    totalUnits += Number(r.quantity || 0)
    rawTotalAmount += Number(r.lineTotal || 0)
    baseListSum += Number(r.listPrice || 0) * Number(r.quantity || 0)
  })

  // Round up total amount to the next whole rupee (e.g. 1952.30 -> 1953)
  const totalAmount = Math.ceil(rawTotalAmount)
  const totalSavings = Math.max(0, Math.round(baseListSum - totalAmount))

  return {
    itemCount: rows.length,
    totalUnits: Number(totalUnits.toFixed(2)),
    totalAmount,
    baseListSum: Number(baseListSum.toFixed(2)),
    totalSavings,
  }
}

