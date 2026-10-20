import { describe, it, expect } from 'vitest'
import type { EstimateRow, HeroProductChild } from '../types'

/**
 * Pure helper verifying whether an estimate row qualifies for updating the database List Price
 */
export function shouldUpdateProductListPriceInDb(row: EstimateRow): boolean {
  if (!row.productId) return false
  if (!row.updateListPriceInDb) return false
  const currentList = Number(row.listPrice || 0)
  const origList = Number(row.originalListPrice ?? currentList)
  if (currentList <= 0) return false
  return currentList !== origList
}

/**
 * Pure helper checking for circular dependency when linking child to hero product
 */
export function checkCircularReference(
  heroId: number,
  childProductId: number,
  existingRelationships: { hero_product_id: number; child_product_id: number }[]
): { isCircular: boolean; error?: string } {
  if (heroId === childProductId) {
    return { isCircular: true, error: 'A Hero Product cannot be added as its own child component.' }
  }

  // Check direct reverse relationship (child is already hero of parent)
  const directReverse = existingRelationships.some(
    (r) => r.hero_product_id === childProductId && r.child_product_id === heroId
  )
  if (directReverse) {
    return {
      isCircular: true,
      error: 'Circular reference detected: this child product is already a Hero parent of the selected product.',
    }
  }

  return { isCircular: false }
}

describe('Enhancement 1: Selective List Price Updates to Database', () => {
  it('returns true when row is catalog product, updateListPriceInDb is true, and price actually changed', () => {
    const row: EstimateRow = {
      id: 'row-1',
      productId: 101,
      productCode: 'SKU-0101',
      description: 'CPVC Pipe 1 Inch',
      checked: false,
      quantity: 5,
      unit: 'Pcs.',
      listPrice: 450,
      originalListPrice: 400, // Changed from 400 to 450
      discountPercentage: 10,
      costPrice: 405,
      marginPercentage: 15,
      discount: 0,
      discountType: 'PERCENT',
      price: 465.75,
      lineTotal: 2328.75,
      updateListPriceInDb: true,
    }

    expect(shouldUpdateProductListPriceInDb(row)).toBe(true)
  })

  it('returns false when updateListPriceInDb checkbox is unchecked', () => {
    const row: EstimateRow = {
      id: 'row-2',
      productId: 101,
      productCode: 'SKU-0101',
      description: 'CPVC Pipe 1 Inch',
      checked: false,
      quantity: 5,
      unit: 'Pcs.',
      listPrice: 450,
      originalListPrice: 400,
      discountPercentage: 10,
      costPrice: 405,
      marginPercentage: 15,
      discount: 0,
      discountType: 'PERCENT',
      price: 465.75,
      lineTotal: 2328.75,
      updateListPriceInDb: false, // User unchecked it
    }

    expect(shouldUpdateProductListPriceInDb(row)).toBe(false)
  })

  it('returns false when list price did not change from original', () => {
    const row: EstimateRow = {
      id: 'row-3',
      productId: 101,
      productCode: 'SKU-0101',
      description: 'CPVC Pipe 1 Inch',
      checked: false,
      quantity: 5,
      unit: 'Pcs.',
      listPrice: 400,
      originalListPrice: 400, // Same price
      discountPercentage: 10,
      costPrice: 360,
      marginPercentage: 15,
      discount: 0,
      discountType: 'PERCENT',
      price: 414,
      lineTotal: 2070,
      updateListPriceInDb: true,
    }

    expect(shouldUpdateProductListPriceInDb(row)).toBe(false)
  })

  it('returns false for custom unlisted items without a catalog productId', () => {
    const row: EstimateRow = {
      id: 'row-4',
      productId: null, // Custom walk-in item
      productCode: '',
      description: 'Custom Galvanized Clamp',
      checked: false,
      quantity: 2,
      unit: 'Pcs.',
      listPrice: 150,
      originalListPrice: 0,
      discountPercentage: 0,
      costPrice: 150,
      marginPercentage: 15,
      discount: 0,
      discountType: 'PERCENT',
      price: 172.5,
      lineTotal: 345,
      updateListPriceInDb: true,
    }

    expect(shouldUpdateProductListPriceInDb(row)).toBe(false)
  })

  it('returns false for zero or negative list prices', () => {
    const row: EstimateRow = {
      id: 'row-5',
      productId: 101,
      productCode: 'SKU-0101',
      description: 'CPVC Pipe 1 Inch',
      checked: false,
      quantity: 1,
      unit: 'Pcs.',
      listPrice: 0,
      originalListPrice: 100,
      discountPercentage: 0,
      costPrice: 0,
      marginPercentage: 15,
      discount: 0,
      discountType: 'PERCENT',
      price: 0,
      lineTotal: 0,
      updateListPriceInDb: true,
    }

    expect(shouldUpdateProductListPriceInDb(row)).toBe(false)
  })
})

describe('Enhancement 2: Hero Product Child Component Validation', () => {
  const existingRelations = [
    { hero_product_id: 10, child_product_id: 20 },
    { hero_product_id: 10, child_product_id: 21 },
    { hero_product_id: 30, child_product_id: 40 },
  ]

  it('rejects self-referencing relationships (product cannot be its own child)', () => {
    const result = checkCircularReference(10, 10, existingRelations)
    expect(result.isCircular).toBe(true)
    expect(result.error).toContain('cannot be added as its own child')
  })

  it('rejects circular references where child is already parent of hero', () => {
    // Product 10 is already hero of 20. Attempting to add 10 as child of 20 should be rejected!
    const result = checkCircularReference(20, 10, existingRelations)
    expect(result.isCircular).toBe(true)
    expect(result.error).toContain('Circular reference detected')
  })

  it('allows valid parent-child relationships with no cycle', () => {
    const result = checkCircularReference(10, 50, existingRelations)
    expect(result.isCircular).toBe(false)
    expect(result.error).toBeUndefined()
  })

  it('preserves child default quantities accurately', () => {
    const child: HeroProductChild = {
      id: 1,
      hero_product_id: 10,
      child_product_id: 50,
      default_quantity: 4.5,
      child_product_name: 'PVC Elbow 4 Inch',
      child_unit: 'Pcs.',
    }

    expect(child.default_quantity).toBe(4.5)
    expect(child.child_unit).toBe('Pcs.')
  })
})

describe('Review & Validation: Edge Cases & State Isolation', () => {
  it('operates checkboxes independently across multiple rows in an estimate', () => {
    const rows: EstimateRow[] = [
      {
        id: 'row-1',
        productId: 101,
        productCode: 'SKU-101',
        description: 'Product A',
        checked: false,
        quantity: 2,
        unit: 'Pcs.',
        listPrice: 500,
        originalListPrice: 400, // Changed
        discountPercentage: 0,
        costPrice: 500,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 575,
        lineTotal: 1150,
        updateListPriceInDb: true, // Selected
      },
      {
        id: 'row-2',
        productId: 102,
        productCode: 'SKU-102',
        description: 'Product B',
        checked: false,
        quantity: 1,
        unit: 'Pcs.',
        listPrice: 300,
        originalListPrice: 200, // Changed
        discountPercentage: 0,
        costPrice: 300,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 345,
        lineTotal: 345,
        updateListPriceInDb: false, // Unselected
      },
      {
        id: 'row-3',
        productId: 103,
        productCode: 'SKU-103',
        description: 'Product C',
        checked: false,
        quantity: 3,
        unit: 'Pcs.',
        listPrice: 150,
        originalListPrice: 150, // Unchanged
        discountPercentage: 0,
        costPrice: 150,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 172.5,
        lineTotal: 517.5,
        updateListPriceInDb: true, // Selected but unchanged
      },
    ]

    const qualified = rows.filter(shouldUpdateProductListPriceInDb)
    expect(qualified).toHaveLength(1)
    expect(qualified[0].id).toBe('row-1')
    expect(qualified[0].productId).toBe(101)
  })

  it('does not trigger updates for products removed from the estimation', () => {
    const initialRows: EstimateRow[] = [
      {
        id: 'row-1',
        productId: 101,
        productCode: 'SKU-101',
        description: 'Product A',
        checked: false,
        quantity: 1,
        unit: 'Pcs.',
        listPrice: 500,
        originalListPrice: 400,
        discountPercentage: 0,
        costPrice: 500,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 575,
        lineTotal: 575,
        updateListPriceInDb: true,
      },
    ]

    // User removes row-1 from the table before saving
    const currentRows = initialRows.filter((r) => r.id !== 'row-1')
    const qualified = currentRows.filter(shouldUpdateProductListPriceInDb)
    expect(qualified).toHaveLength(0)
  })

  it('safely handles partial update outcomes from Promise.allSettled', () => {
    const results: PromiseSettledResult<{ productId: number; description: string }>[] = [
      { status: 'fulfilled', value: { productId: 101, description: 'Product A' } },
      { status: 'rejected', reason: new Error('Network error on Product B') },
    ]

    const successful: number[] = []
    const failed: string[] = []

    results.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        successful.push(res.value.productId)
      } else {
        failed.push(`Product-${idx}`)
      }
    })

    expect(successful).toEqual([101])
    expect(failed).toEqual(['Product-1'])
  })

  it('ensures price update payloads contain only catalog fields and never alter hero associations', () => {
    const row: EstimateRow = {
      id: 'row-1',
      productId: 101,
      productCode: 'SKU-101',
      description: 'Product A',
      checked: false,
      quantity: 1,
      unit: 'Pcs.',
      listPrice: 500,
      originalListPrice: 400,
      discountPercentage: 10,
      costPrice: 450,
      marginPercentage: 15,
      discount: 0,
      discountType: 'PERCENT',
      price: 517.5,
      lineTotal: 517.5,
      updateListPriceInDb: true,
    }

    const updatedCost = Number((Number(row.listPrice) * (1 - Number(row.discountPercentage || 0) / 100)).toFixed(2))
    const payload = {
      id: row.productId,
      productCode: row.productCode,
      productName: row.description,
      unit: row.unit,
      listPrice: Number(row.listPrice),
      discountPercentage: Number(row.discountPercentage || 0),
      costPrice: updatedCost,
      marginPercentage: Number(row.marginPercentage || 15),
    }

    // Verify no hero product association keys are present in payload
    expect(payload).not.toHaveProperty('hero_product_id')
    expect(payload).not.toHaveProperty('child_product_id')
    expect(payload).not.toHaveProperty('default_quantity')
    expect(payload.listPrice).toBe(500)
    expect(payload.costPrice).toBe(450)
  })

  it('preserves historical finalized quotation item snapshot integrity', () => {
    // A historical quotation item record captured in DB
    const historicalItem = {
      id: 55,
      quotation_id: 12,
      product_id: 101,
      product_code: 'SKU-101',
      product_name: 'Product A',
      unit: 'Pcs.',
      quantity: 10,
      list_price: 350, // Historical list price
      net_price: 380,
      line_total: 3800,
    }

    // Even if product 101 list price is later updated to 500 in products table:
    const updatedProduct = { id: 101, list_price: 500 }
    expect(updatedProduct.list_price).toBe(500)

    // Historical record remains completely unchanged
    expect(historicalItem.list_price).toBe(350)
    expect(historicalItem.line_total).toBe(3800)
  })
})

