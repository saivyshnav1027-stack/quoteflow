import {
  calculateCostFromListAndDiscount,
  calculateDiscountFromListAndCost,
  calculateMarginFromCostAndNetPrice,
  calculateNetPriceFromCostAndMargin,
} from './pricing'

export type PricingCalculationMode = 'MODE_A' | 'MODE_B'

export interface RawImportRow {
  productCode?: string
  productName?: string
  unit?: string
  listPrice?: number | string
  discountPercentage?: number | string
  costPrice?: number | string
  marginPercentage?: number | string
  netPrice?: number | string
}

export interface ValidatedImportRow {
  productCode: string
  productName: string
  unit: string
  listPrice: number
  discountPercentage: number
  costPrice: number
  marginPercentage: number
  netPrice: number
  isUpdate: boolean
  status: 'valid' | 'invalid'
  errors: string[]
}

/**
 * Normalizes vendor unit strings to canonical QuoteFlow units.
 * Sri Venkateshwara Trading & Co canonical units: Pcs., Mtr., Kgs., Rolls, Sets, Ft.
 */
export function normalizeUnit(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return 'Pcs.'
  const clean = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

  if (!clean) return 'Pcs.'

  // Pcs: pcs, pc, piece, pieces, nos, no, number, numbers, each, ea, item, units
  if (
    clean === 'pc' ||
    clean === 'pcs' ||
    clean === 'piece' ||
    clean === 'pieces' ||
    clean === 'no' ||
    clean === 'nos' ||
    clean === 'number' ||
    clean === 'numbers' ||
    clean === 'each' ||
    clean === 'ea' ||
    clean === 'item' ||
    clean === 'unit' ||
    clean === 'units'
  ) {
    return 'Pcs.'
  }

  // Mtr: mtr, mtrs, meter, meters, metre, metres, m, mt
  if (
    clean === 'mtr' ||
    clean === 'mtrs' ||
    clean === 'meter' ||
    clean === 'meters' ||
    clean === 'metre' ||
    clean === 'metres' ||
    clean === 'm' ||
    clean === 'mt'
  ) {
    return 'Mtr.'
  }

  // Kgs: kg, kgs, kilo, kilogram, kilograms, gm, gms, gram, grams
  if (
    clean === 'kg' ||
    clean === 'kgs' ||
    clean === 'kilo' ||
    clean === 'kilogram' ||
    clean === 'kilograms' ||
    clean === 'gm' ||
    clean === 'gms' ||
    clean === 'gram' ||
    clean === 'grams'
  ) {
    return 'Kgs.'
  }

  // Rolls: roll, rolls, rll, rls, bundle, bundles, bndl
  if (
    clean === 'roll' ||
    clean === 'rolls' ||
    clean === 'rll' ||
    clean === 'rls' ||
    clean === 'bundle' ||
    clean === 'bundles' ||
    clean === 'bndl'
  ) {
    return 'Rolls'
  }

  // Sets: set, sets, pair, pairs, kit, kits
  if (
    clean === 'set' ||
    clean === 'sets' ||
    clean === 'pair' ||
    clean === 'pairs' ||
    clean === 'kit' ||
    clean === 'kits'
  ) {
    return 'Sets'
  }

  // Ft: ft, foot, feet, rft
  if (clean === 'ft' || clean === 'foot' || clean === 'feet' || clean === 'rft') {
    return 'Ft.'
  }

  return 'Pcs.'
}

/**
 * Parses numeric inputs safely, handling commas, spaces, currency symbols.
 */
export function parseNumericField(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

/**
 * Resolves pricing calculations for a single imported row based on selected mode.
 * Mode A: Rupee Amounts Superior (Cost Price & Net Price are sacred -> derives Trade Discount % and Margin %)
 * Mode B: Percentages Superior (Trade Discount % & Margin % are sacred -> derives Cost Price and Net Price)
 */
export function calculateRowPrices(
  row: RawImportRow,
  mode: PricingCalculationMode = 'MODE_A'
): {
  listPrice: number
  discountPercentage: number
  costPrice: number
  marginPercentage: number
  netPrice: number
} {
  const listPrice = Math.max(0, parseNumericField(row.listPrice))
  let discountPercentage = Math.max(0, parseNumericField(row.discountPercentage))
  let costPrice = Math.max(0, parseNumericField(row.costPrice))
  let marginPercentage = Math.max(0, parseNumericField(row.marginPercentage))
  let netPrice = Math.max(0, parseNumericField(row.netPrice))

  if (mode === 'MODE_A') {
    // Mode A: Rupee Amounts are superior.
    // If costPrice is provided, it is ground truth.
    if (costPrice > 0) {
      if (listPrice > 0) {
        discountPercentage = calculateDiscountFromListAndCost(listPrice, costPrice)
      }
      if (netPrice > 0) {
        marginPercentage = calculateMarginFromCostAndNetPrice(costPrice, netPrice)
      } else {
        const effectiveMargin = marginPercentage > 0 ? marginPercentage : 15
        marginPercentage = effectiveMargin
        netPrice = calculateNetPriceFromCostAndMargin(costPrice, effectiveMargin)
      }
    } else if (listPrice > 0) {
      // Cost price not provided, but list price and discount are available
      costPrice = calculateCostFromListAndDiscount(listPrice, discountPercentage)
      if (netPrice > 0) {
        marginPercentage = calculateMarginFromCostAndNetPrice(costPrice, netPrice)
      } else {
        const effectiveMargin = marginPercentage > 0 ? marginPercentage : 15
        marginPercentage = effectiveMargin
        netPrice = calculateNetPriceFromCostAndMargin(costPrice, effectiveMargin)
      }
    }
  } else {
    // Mode B: Percentages are superior.
    const effectiveMargin = marginPercentage > 0 ? marginPercentage : 15
    marginPercentage = effectiveMargin

    if (listPrice > 0) {
      costPrice = calculateCostFromListAndDiscount(listPrice, discountPercentage)
      netPrice = calculateNetPriceFromCostAndMargin(costPrice, effectiveMargin)
    } else if (costPrice > 0) {
      netPrice = calculateNetPriceFromCostAndMargin(costPrice, effectiveMargin)
    }
  }

  return {
    listPrice: Number(listPrice.toFixed(2)),
    discountPercentage: Number(discountPercentage.toFixed(2)),
    costPrice: Number(costPrice.toFixed(2)),
    marginPercentage: Number(marginPercentage.toFixed(2)),
    netPrice: Number(netPrice.toFixed(2)),
  }
}

/**
 * Validates and transforms a raw row against existing SKU map.
 */
export function validateImportRow(
  row: RawImportRow,
  existingSkuMap: Set<string>,
  mode: PricingCalculationMode = 'MODE_A'
): ValidatedImportRow {
  const errors: string[] = []
  const name = (row.productName || '').trim()
  const rawCode = (row.productCode || '').trim().toUpperCase()

  if (!name) {
    errors.push('Product name is required')
  }

  const { listPrice, discountPercentage, costPrice, marginPercentage, netPrice } =
    calculateRowPrices(row, mode)

  if (costPrice <= 0 && listPrice <= 0) {
    errors.push('Either Cost Price or List Price must be greater than 0')
  }

  const isUpdate = rawCode ? existingSkuMap.has(rawCode) : false
  const unit = normalizeUnit(row.unit)

  return {
    productCode: rawCode,
    productName: name,
    unit,
    listPrice,
    discountPercentage,
    costPrice,
    marginPercentage,
    netPrice,
    isUpdate,
    status: errors.length === 0 ? 'valid' : 'invalid',
    errors,
  }
}

/**
 * Chunks array into batches (default 100 items per batch for production network resilience).
 */
export function chunkArray<T>(items: T[], chunkSize = 100): T[][] {
  if (chunkSize <= 0) return [items]
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Formats estimated time remaining given remaining batch count.
 */
export function formatETA(seconds: number): string {
  if (seconds <= 0) return 'Almost done...'
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`
  const mins = Math.floor(seconds / 60)
  const remSecs = Math.ceil(seconds % 60)
  return `${mins}m ${remSecs}s remaining`
}
