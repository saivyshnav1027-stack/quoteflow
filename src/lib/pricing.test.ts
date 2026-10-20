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
  it('calculates standard row with default 15% margin', () => {
    // Cost: 1000, Margin: 15% -> Net Price: 1150.00, Qty: 2 -> 2300.00
    const row = createMockRow({ costPrice: 1000, marginPercentage: 15, quantity: 2 })
    const result = calculateRow(row)

    expect(result.costPrice).toBe(1000)
    expect(result.marginPercentage).toBe(15)
    expect(result.price).toBe(1150.00)
    expect(result.lineTotal).toBe(2300.00)
  })

  it('calculates row with custom margin (20%) directly to Net Price', () => {
    // Cost: 1500, Margin: 20% -> Net Price: 1800.00, Qty: 3 -> Amount: 5400.00
    const row = createMockRow({
      costPrice: 1500,
      marginPercentage: 20,
      quantity: 3,
    })
    const result = calculateRow(row)

    expect(result.price).toBe(1800.00)
    expect(result.lineTotal).toBe(5400.00)
  })

  it('derives Cost Price from List Price and Trade Discount when List Price Mode is ON', () => {
    // List: 2500, Trade Dis: 16% -> Cost: 2500 * 0.84 = 2100.00
    // Margin: 15% -> Net Price: 2415.00
    // Qty: 2 -> Line Total: 4830.00
    const row = createMockRow({
      listPrice: 2500,
      discountPercentage: 16,
      costPrice: 0,
      marginPercentage: 15,
      quantity: 2,
    })
    const result = calculateRow(row, true)

    expect(result.costPrice).toBe(2100.00)
    expect(result.price).toBe(2415.00)
    expect(result.lineTotal).toBe(4830.00)
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
})

describe('Pricing Engine: calculateTotals', () => {
  it('correctly aggregates total units and rounds up fractional amounts with Math.ceil', () => {
    // e.g. 1952.30 -> rounds up to 1953
    const rows = [
      createMockRow({ quantity: 1, lineTotal: 1000.10 }),
      createMockRow({ quantity: 1, lineTotal: 952.20 }),
    ]
    const totals = calculateTotals(rows)

    expect(totals.totalUnits).toBe(2)
    // 1000.10 + 952.20 = 1952.30 -> Math.ceil gives 1953
    expect(totals.totalAmount).toBe(1953)
  })
})

describe('Pricing Engine: Two-Way Bidirectional Derivation (Option 2)', () => {
  it('editing Net Price directly auto-derives and updates marginPercentage', () => {
    // Cost: 1000, user directly enters Net Price: 1250 at counter
    // Expected Margin%: ((1250 - 1000) / 1000) * 100 = 25%
    const row = createMockRow({
      costPrice: 1000,
      marginPercentage: 15,
      price: 1250,
      quantity: 2,
    })
    const result = calculateRow(row, true, 'price')

    expect(result.marginPercentage).toBe(25)
    expect(result.price).toBe(1250)
    expect(result.lineTotal).toBe(2500)
  })

  it('editing Margin% recalculates Net Price', () => {
    // Cost: 1000, user sets margin to 30%
    // Expected Net Price: 1000 * 1.30 = 1300
    const row = createMockRow({
      costPrice: 1000,
      marginPercentage: 30,
      price: 1150,
      quantity: 1,
    })
    const result = calculateRow(row, true, 'marginPercentage')

    expect(result.marginPercentage).toBe(30)
    expect(result.price).toBe(1300)
    expect(result.lineTotal).toBe(1300)
  })

  it('handles negative margin gracefully if counter price is below cost', () => {
    // Cost: 1000, user sells at discount: 900
    // Margin%: ((900 - 1000) / 1000) * 100 = -10%
    const row = createMockRow({
      costPrice: 1000,
      marginPercentage: 15,
      price: 900,
      quantity: 1,
    })
    const result = calculateRow(row, true, 'price')

    expect(result.marginPercentage).toBe(-10)
    expect(result.price).toBe(900)
  })
})

describe('Pricing Engine: calculateTotals with Cash Discount & Shopkeeper Profit', () => {
  it('correctly aggregates grossTotal, applies cashDiscount, and rounds final total', () => {
    // Row 1: 1 unit @ 1000.10, Cost: 800
    // Row 2: 1 unit @ 952.20, Cost: 700
    // Gross: 1952.30
    // Cash Discount: 52.30
    // Net Payable: Math.ceil(1952.30 - 52.30) = 1900
    // Total Cost: 800 + 700 = 1500
    // Total Profit: 1900 - 1500 = 400
    // Profit Margin%: (400 / 1900) * 100 = 21.05%
    const rows = [
      createMockRow({ quantity: 1, lineTotal: 1000.10, costPrice: 800 }),
      createMockRow({ quantity: 1, lineTotal: 952.20, costPrice: 700 }),
    ]
    const totals = calculateTotals(rows, 52.30)

    expect(totals.totalUnits).toBe(2)
    expect(totals.grossTotal).toBe(1952.3)
    expect(totals.cashDiscount).toBe(52.3)
    expect(totals.totalAmount).toBe(1900)
    expect(totals.totalCost).toBe(1500)
    expect(totals.totalProfit).toBe(400)
    expect(totals.profitMarginPercentage).toBeCloseTo(21.05, 1)
  })

  it('keeps exact whole rupee amount unchanged when cash discount is 0', () => {
    const rows = [
      createMockRow({ quantity: 1, lineTotal: 1952.00, costPrice: 1500 }),
    ]
    const totals = calculateTotals(rows, 0)

    expect(totals.totalUnits).toBe(1)
    expect(totals.grossTotal).toBe(1952)
    expect(totals.cashDiscount).toBe(0)
    expect(totals.totalAmount).toBe(1952)
    expect(totals.totalCost).toBe(1500)
    expect(totals.totalProfit).toBe(452)
  })

  it('clamps totalAmount to 0 if cash discount exceeds gross total', () => {
    const rows = [
      createMockRow({ quantity: 1, lineTotal: 500, costPrice: 400 }),
    ]
    const totals = calculateTotals(rows, 600)

    expect(totals.totalAmount).toBe(0)
    expect(totals.totalProfit).toBe(-400)
  })

  it('returns zero for empty rows', () => {
    const totals = calculateTotals([])
    expect(totals.totalUnits).toBe(0)
    expect(totals.grossTotal).toBe(0)
    expect(totals.cashDiscount).toBe(0)
    expect(totals.totalAmount).toBe(0)
    expect(totals.totalCost).toBe(0)
    expect(totals.totalProfit).toBe(0)
  })
})

describe('Pricing Engine: formatINR', () => {
  it('formats currency numbers into INR currency string', () => {
    const formatted = formatINR(7020)
    expect(formatted).toContain('7,020.00')
  })
})
