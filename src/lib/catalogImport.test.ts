import { describe, it, expect } from 'vitest'
import {
  normalizeUnit,
  parseNumericField,
  calculateRowPrices,
  validateImportRow,
  chunkArray,
  formatETA,
} from './catalogImport'

describe('normalizeUnit', () => {
  it('normalizes common misspellings to Pcs.', () => {
    expect(normalizeUnit('pcs')).toBe('Pcs.')
    expect(normalizeUnit('PCS')).toBe('Pcs.')
    expect(normalizeUnit('pieces')).toBe('Pcs.')
    expect(normalizeUnit('piece')).toBe('Pcs.')
    expect(normalizeUnit('Nos')).toBe('Pcs.')
    expect(normalizeUnit('no.')).toBe('Pcs.')
    expect(normalizeUnit('each')).toBe('Pcs.')
    expect(normalizeUnit('units')).toBe('Pcs.')
    expect(normalizeUnit('')).toBe('Pcs.')
    expect(normalizeUnit(null)).toBe('Pcs.')
    expect(normalizeUnit(undefined)).toBe('Pcs.')
  })

  it('normalizes meters to Mtr.', () => {
    expect(normalizeUnit('mtr')).toBe('Mtr.')
    expect(normalizeUnit('MTRS')).toBe('Mtr.')
    expect(normalizeUnit('meter')).toBe('Mtr.')
    expect(normalizeUnit('meters')).toBe('Mtr.')
    expect(normalizeUnit('metre')).toBe('Mtr.')
    expect(normalizeUnit('m')).toBe('Mtr.')
  })

  it('normalizes kilograms to Kgs.', () => {
    expect(normalizeUnit('kg')).toBe('Kgs.')
    expect(normalizeUnit('kgs')).toBe('Kgs.')
    expect(normalizeUnit('kilogram')).toBe('Kgs.')
    expect(normalizeUnit('gms')).toBe('Kgs.')
  })

  it('normalizes rolls to Rolls', () => {
    expect(normalizeUnit('roll')).toBe('Rolls')
    expect(normalizeUnit('ROLLS')).toBe('Rolls')
    expect(normalizeUnit('bundle')).toBe('Rolls')
    expect(normalizeUnit('bndl')).toBe('Rolls')
  })

  it('normalizes sets to Sets', () => {
    expect(normalizeUnit('set')).toBe('Sets')
    expect(normalizeUnit('SETS')).toBe('Sets')
    expect(normalizeUnit('pair')).toBe('Sets')
    expect(normalizeUnit('kit')).toBe('Sets')
  })

  it('normalizes feet to Ft.', () => {
    expect(normalizeUnit('ft')).toBe('Ft.')
    expect(normalizeUnit('feet')).toBe('Ft.')
    expect(normalizeUnit('foot')).toBe('Ft.')
  })
})

describe('parseNumericField', () => {
  it('handles numbers, strings with currency symbols, and commas', () => {
    expect(parseNumericField(100)).toBe(100)
    expect(parseNumericField(' ₹1,250.50 ')).toBe(1250.5)
    expect(parseNumericField('45%')).toBe(45)
    expect(parseNumericField(null)).toBe(0)
    expect(parseNumericField('invalid')).toBe(0)
  })
})

describe('calculateRowPrices', () => {
  it('Mode A: Rupee Amounts Superior - calculates discount % and margin % from Cost and Net', () => {
    // List: 1000, Cost: 600, Net: 720
    const result = calculateRowPrices(
      {
        listPrice: 1000,
        costPrice: 600,
        netPrice: 720,
      },
      'MODE_A'
    )

    expect(result.listPrice).toBe(1000)
    expect(result.costPrice).toBe(600)
    expect(result.discountPercentage).toBe(40) // (1000 - 600)/1000 = 40%
    expect(result.netPrice).toBe(720)
    expect(result.marginPercentage).toBe(20) // (720 - 600)/600 = 20%
  })

  it('Mode A: derives Net Price if only Cost Price and default Margin % are provided', () => {
    const result = calculateRowPrices(
      {
        listPrice: 500,
        costPrice: 200,
        marginPercentage: 25,
      },
      'MODE_A'
    )

    expect(result.costPrice).toBe(200)
    expect(result.marginPercentage).toBe(25)
    expect(result.netPrice).toBe(250) // 200 * 1.25 = 250
    expect(result.discountPercentage).toBe(60) // (500 - 200)/500 = 60%
  })

  it('Mode B: Percentages Superior - derives Cost and Net from List, Discount %, and Margin %', () => {
    // List: 1000, Discount: 40%, Margin: 20%
    const result = calculateRowPrices(
      {
        listPrice: 1000,
        discountPercentage: 40,
        marginPercentage: 20,
      },
      'MODE_B'
    )

    expect(result.costPrice).toBe(600) // 1000 * 0.60 = 600
    expect(result.netPrice).toBe(720) // 600 * 1.20 = 720
    expect(result.discountPercentage).toBe(40)
    expect(result.marginPercentage).toBe(20)
  })
})

describe('validateImportRow', () => {
  const existingSkus = new Set(['CPVC-001', 'PVC-002'])

  it('flags existing SKU as isUpdate: true', () => {
    const row = validateImportRow(
      {
        productCode: 'cpvc-001',
        productName: 'CPVC Elbow 1 inch',
        costPrice: 50,
        netPrice: 60,
      },
      existingSkus,
      'MODE_A'
    )

    expect(row.status).toBe('valid')
    expect(row.isUpdate).toBe(true)
    expect(row.productCode).toBe('CPVC-001')
  })

  it('identifies new SKU as isUpdate: false', () => {
    const row = validateImportRow(
      {
        productCode: 'NEW-001',
        productName: 'Brand New Valve',
        costPrice: 150,
      },
      existingSkus,
      'MODE_A'
    )

    expect(row.status).toBe('valid')
    expect(row.isUpdate).toBe(false)
  })

  it('marks row invalid if product name is missing', () => {
    const row = validateImportRow(
      {
        productCode: 'TEST',
        costPrice: 100,
      },
      existingSkus
    )

    expect(row.status).toBe('invalid')
    expect(row.errors).toContain('Product name is required')
  })

  it('marks row invalid if both costPrice and listPrice are 0', () => {
    const row = validateImportRow(
      {
        productName: 'Empty Price Product',
        costPrice: 0,
        listPrice: 0,
      },
      existingSkus
    )

    expect(row.status).toBe('invalid')
    expect(row.errors).toContain('Either Cost Price or List Price must be greater than 0')
  })
})

describe('chunkArray', () => {
  it('correctly splits into chunks of 100', () => {
    const items = Array.from({ length: 245 }, (_, i) => i)
    const chunks = chunkArray(items, 100)
    expect(chunks.length).toBe(3)
    expect(chunks[0].length).toBe(100)
    expect(chunks[1].length).toBe(100)
    expect(chunks[2].length).toBe(45)
  })

  it('handles empty arrays', () => {
    expect(chunkArray([], 100)).toEqual([])
  })
})

describe('formatETA', () => {
  it('formats seconds and minutes correctly', () => {
    expect(formatETA(0)).toBe('Almost done...')
    expect(formatETA(25)).toBe('25s remaining')
    expect(formatETA(90)).toBe('1m 30s remaining')
  })
})
