import { describe, it, expect } from 'vitest'
import { calculateRow, calculateTotals, formatINR } from './pricing'
import type { EstimateRow } from '../types'

const createMockRow = (overrides: Partial<EstimateRow> = {}): EstimateRow => ({
  id: 'test-1',
  productId: 1,
  productCode: 'TEST-01',
  description: 'Test Item',
  checked: false,
  quantity: 1,
  unit: 'Pcs.',
  listPrice: 0,
  discountPercentage: 0,
  costPrice: 1000,
  marginPercentage: 15,
  discount: 0,
  discountType: 'PERCENT',
  price: 0,
  lineTotal: 0,
  ...overrides,
})

describe('Pricing Engine: calculateRow', () => {
  it('calculates standard row with default 15% margin and 0% discount', () => {
    // Cost: 1000, Margin: 15% -> Price After Margin: 1150.00, Net Price: 1150.00, Qty: 2 -> 2300.00
    const row = createMockRow({ costPrice: 1000, marginPercentage: 15, quantity: 2 })
    const result = calculateRow(row)

    expect(result.costPrice).toBe(1000)
    expect(result.marginPercentage).toBe(15)
    expect(result.price).toBe(1150.00)
    expect(result.lineTotal).toBe(2300.00)
  })

  it('calculates row with custom margin (20%) and percentage customer discount (10%)', () => {
    // Cost: 1500, Margin: 20% -> Price After Margin: 1800.00
    // Cust Dis: 10% -> Net Price: 1620.00, Qty: 3 -> Amount: 4860.00
    const row = createMockRow({
      costPrice: 1500,
      marginPercentage: 20,
      discount: 10,
      discountType: 'PERCENT',
      quantity: 3,
    })
    const result = calculateRow(row)

    expect(result.price).toBe(1620.00)
    expect(result.lineTotal).toBe(4860.00)
  })

  it('calculates row with Flat Rupee discount (RUPEE mode)', () => {
    // Cost: 2000, Margin: 10% -> Price After Margin: 2200.00
    // Flat Rupee Dis: 150 -> Net Price: 2050.00, Qty: 2 -> Amount: 4100.00
    const row = createMockRow({
      costPrice: 2000,
      marginPercentage: 10,
      discount: 150,
      discountType: 'RUPEE',
      quantity: 2,
    })
    const result = calculateRow(row)

    expect(result.price).toBe(2050.00)
    expect(result.lineTotal).toBe(4100.00)
  })

  it('derives Cost Price from List Price and Trade Discount when List Price Mode is ON', () => {
    // List: 2500, Trade Dis: 16% -> Cost: 2500 * 0.84 = 2100.00
    // Margin: 15% -> Price After Margin: 2415.00
    // Customer Dis: 5% -> Net Price: 2294.25
    // Qty: 2 -> Line Total: 4588.50
    const row = createMockRow({
      listPrice: 2500,
      discountPercentage: 16,
      costPrice: 0,
      marginPercentage: 15,
      discount: 5,
      discountType: 'PERCENT',
      quantity: 2,
    })
    const result = calculateRow(row, true)

    expect(result.costPrice).toBe(2100.00)
    expect(result.price).toBe(2294.25)
    expect(result.lineTotal).toBe(4588.50)
  })

  it('handles fractional quantities accurately (e.g. 2.75 Kgs)', () => {
    // Cost: 100, Margin: 20% -> Net Price: 120.00, Qty: 2.75 -> Line Total: 330.00
    const row = createMockRow({
      costPrice: 100,
      marginPercentage: 20,
      unit: 'Kgs.',
      quantity: 2.75,
    })
    const result = calculateRow(row)

    expect(result.price).toBe(120.00)
    expect(result.lineTotal).toBe(330.00)
  })

  it('handles zero quantity cleanly without crashing or NaN', () => {
    const row = createMockRow({ costPrice: 500, quantity: 0 })
    const result = calculateRow(row)

    expect(result.price).toBe(575.00)
    expect(result.lineTotal).toBe(0)
  })

  it('prevents negative net price if flat discount exceeds price after margin', () => {
    // Cost: 100, Margin: 10% -> Price After Margin: 110.00
    // Flat Dis: 200 -> Net Price capped at 0
    const row = createMockRow({
      costPrice: 100,
      marginPercentage: 10,
      discount: 200,
      discountType: 'RUPEE',
      quantity: 1,
    })
    const result = calculateRow(row)

    expect(result.price).toBe(0)
    expect(result.lineTotal).toBe(0)
  })
})

describe('Pricing Engine: calculateTotals', () => {
  it('correctly aggregates total units and total amounts', () => {
    const rows = [
      createMockRow({ quantity: 3, lineTotal: 5400.00 }),
      createMockRow({ quantity: 1, lineTotal: 1620.00 }),
      createMockRow({ quantity: 0.5, lineTotal: 250.00 }),
    ]
    const totals = calculateTotals(rows)

    expect(totals.totalUnits).toBe(4.50)
    expect(totals.totalAmount).toBe(7270.00)
  })

  it('returns zero for empty rows', () => {
    const totals = calculateTotals([])
    expect(totals.totalUnits).toBe(0)
    expect(totals.totalAmount).toBe(0)
  })
})

describe('Pricing Engine: formatINR', () => {
  it('formats currency numbers into INR currency string', () => {
    const formatted = formatINR(7020)
    expect(formatted).toContain('7,020.00')
  })
})
