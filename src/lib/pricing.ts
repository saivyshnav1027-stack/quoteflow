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
 * Pure calculation helpers for interconnected pricing
 */
export const calculateCostFromListAndDiscount = (listPrice: number, tradeDisPercentage: number): number => {
  const list = Number(listPrice || 0)
  const dis = Number(tradeDisPercentage || 0)
  if (list <= 0) return 0
  return Number((list * (1 - dis / 100)).toFixed(2))
}

export const calculateDiscountFromListAndCost = (listPrice: number, costPrice: number): number => {
  const list = Number(listPrice || 0)
  const cost = Number(costPrice || 0)
  if (list <= 0) return 0
  return Number((((list - cost) / list) * 100).toFixed(2))
}

export const calculateNetPriceFromCostAndMargin = (costPrice: number, marginPercentage: number): number => {
  const cost = Number(costPrice || 0)
  const margin = Number(marginPercentage || 0)
  return Number((cost * (1 + margin / 100)).toFixed(2))
}

export const calculateMarginFromCostAndNetPrice = (costPrice: number, netPrice: number): number => {
  const cost = Number(costPrice || 0)
  const net = Number(netPrice || 0)
  if (cost <= 0) return 0
  return Number((((net - cost) / cost) * 100).toFixed(2))
}

/**
 * Pure calculation function for an individual estimate row.
 * Supports two-way bidirectional synchronization:
 * - If user updates marginPercentage -> derives Net Price
 * - If user updates price (Net Price) -> back-calculates Margin%
 * - If user updates listPrice or discountPercentage -> updates Cost & Net Price
 * - If user updates costPrice -> derives Trade Dis% and updates Net Price
 */
export const calculateRow = (
  row: EstimateRow,
  enableListPriceMode = false,
  fieldChanged?: 'marginPercentage' | 'price' | 'listPrice' | 'discountPercentage' | 'costPrice' | 'quantity'
): EstimateRow => {
  let cost = Number(row.costPrice || 0)
  const list = Number(row.listPrice || 0)
  let tradeDis = Number(row.discountPercentage || 0)
  let marginPct = Number(row.marginPercentage ?? 15)
  let netPrice = Number(row.price || 0)

  if (fieldChanged === 'price') {
    // Case 2: Direct Net Price entered -> back-calculate Margin %
    if (cost > 0) {
      marginPct = calculateMarginFromCostAndNetPrice(cost, netPrice)
    }
  } else if (fieldChanged === 'costPrice') {
    // User directly edited Cost Price -> update Trade Dis% if list exists, and update Net Price
    if (list > 0) {
      tradeDis = calculateDiscountFromListAndCost(list, cost)
    }
    netPrice = calculateNetPriceFromCostAndMargin(cost, marginPct)
  } else if (fieldChanged === 'listPrice' || fieldChanged === 'discountPercentage') {
    // User edited List Price or Trade Dis% -> update Cost Price and Net Price
    if (list > 0) {
      cost = calculateCostFromListAndDiscount(list, tradeDis)
    }
    netPrice = calculateNetPriceFromCostAndMargin(cost, marginPct)
  } else {
    // Case 1 / Default: Margin% or Quantity changed
    if (enableListPriceMode && list > 0 && fieldChanged !== 'marginPercentage') {
      cost = calculateCostFromListAndDiscount(list, tradeDis)
    }
    netPrice = calculateNetPriceFromCostAndMargin(cost, marginPct)
  }

  const qty = Number(row.quantity || 0)
  const lineTotal = Number((netPrice * qty).toFixed(2))

  return {
    ...row,
    listPrice: list,
    discountPercentage: tradeDis,
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
  grossTotal: number
  cashDiscount: number
  totalAmount: number
  totalCost: number
  totalProfit: number
  profitMarginPercentage: number
  baseListSum: number
  totalSavings: number
}

/**
 * Pure calculation of aggregated units, discount, total sum, and shopkeeper profit.
 * Total amount is rounded up to the next whole rupee using Math.ceil.
 */
export const calculateTotals = (rows: EstimateRow[], cashDiscount = 0): EstimateTotals => {
  let totalUnits = 0
  let grossTotal = 0
  let totalCost = 0
  let baseListSum = 0

  rows.forEach((r) => {
    const qty = Number(r.quantity || 0)
    totalUnits += qty
    grossTotal += Number(r.lineTotal || 0)
    totalCost += Number(r.costPrice || 0) * qty
    baseListSum += Number(r.listPrice || 0) * qty
  })

  const discount = Math.max(0, Number(cashDiscount || 0))
  // Round to 2 decimals first to avoid floating point anomalies (e.g. 1952.3 - 52.3 = 1900.0000000000002)
  const netBeforeCeil = Number((grossTotal - discount).toFixed(2))
  // Round up final customer payable amount to next whole rupee
  const totalAmount = Math.max(0, Math.ceil(netBeforeCeil))
  const totalProfit = Number((totalAmount - totalCost).toFixed(2))
  const profitMarginPercentage = totalAmount > 0 ? Number(((totalProfit / totalAmount) * 100).toFixed(2)) : 0
  const totalSavings = Math.max(0, Math.round(baseListSum - totalAmount))

  return {
    itemCount: rows.length,
    totalUnits: Number(totalUnits.toFixed(2)),
    grossTotal: Number(grossTotal.toFixed(2)),
    cashDiscount: discount,
    totalAmount,
    totalCost: Number(totalCost.toFixed(2)),
    totalProfit,
    profitMarginPercentage,
    baseListSum: Number(baseListSum.toFixed(2)),
    totalSavings,
  }
}

