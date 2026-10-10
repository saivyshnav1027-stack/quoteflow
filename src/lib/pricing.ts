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
  // Formula: Price After Margin = Cost Price * (1 + Margin / 100)
  const priceAfterMargin = Number((cost * (1 + marginPct / 100)).toFixed(2))

  // Customer Discount (either percent % or flat ₹ rupee)
  const dis = Number(row.discount || 0)
  const disType = row.discountType || 'PERCENT'
  const netPrice = disType === 'PERCENT'
    ? Number((priceAfterMargin * (1 - dis / 100)).toFixed(2))
    : Number(Math.max(0, priceAfterMargin - dis).toFixed(2))

  const qty = Number(row.quantity || 0)
  const lineTotal = Number((netPrice * qty).toFixed(2))

  return {
    ...row,
    costPrice: cost,
    marginPercentage: marginPct,
    price: netPrice,
    lineTotal,
  }
}

/**
 * Pure calculation of aggregated units and total sum across all estimate rows
 */
export const calculateTotals = (rows: EstimateRow[]): { totalUnits: number; totalAmount: number } => {
  const totalUnits = Number(rows.reduce((sum, r) => sum + Number(r.quantity || 0), 0).toFixed(2))
  const totalAmount = Number(rows.reduce((sum, r) => sum + Number(r.lineTotal || 0), 0).toFixed(2))
  return { totalUnits, totalAmount }
}
