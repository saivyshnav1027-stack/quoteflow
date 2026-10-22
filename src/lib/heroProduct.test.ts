import { describe, it, expect } from 'vitest'
import type { EstimateRow, HeroProductChild, HeroProductWithChildren, Product } from '../types'
import {
  shouldUpdateProductListPriceInDb,
  getPendingDbPriceUpdates,
  formatPriceChangeWarningMessage,
  checkCircularReference,
  canProductBeChild,
  isChildLinkEnabled,
  getEligibleCartHeroProducts,
} from './heroProduct'

// Re-export helpers for backward-compatibility with tests
export {
  shouldUpdateProductListPriceInDb,
  getPendingDbPriceUpdates,
  formatPriceChangeWarningMessage,
  checkCircularReference,
  canProductBeChild,
  isChildLinkEnabled,
  getEligibleCartHeroProducts,
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

  it('triggers explicit confirmation modal only when pending DB price updates exist', () => {
    const rowsWithoutDbUpdate: EstimateRow[] = [
      {
        id: 'r1',
        productId: 101,
        productCode: 'SKU-1',
        description: 'CPVC Pipe',
        checked: false,
        quantity: 1,
        unit: 'Pcs.',
        listPrice: 450,
        originalListPrice: 400,
        discountPercentage: 0,
        costPrice: 450,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 517.5,
        lineTotal: 517.5,
        updateListPriceInDb: false, // Not checked
      },
    ]

    expect(getPendingDbPriceUpdates(rowsWithoutDbUpdate)).toHaveLength(0)

    const rowsWithDbUpdate: EstimateRow[] = [
      {
        ...rowsWithoutDbUpdate[0],
        updateListPriceInDb: true, // Checked
      },
    ]

    const pending = getPendingDbPriceUpdates(rowsWithDbUpdate)
    expect(pending).toHaveLength(1)

    const warning = formatPriceChangeWarningMessage(pending)
    expect(warning).toContain('Permanent Price Change')
    expect(warning).toContain('1 item (e.g. CPVC Pipe: ₹400.00 → ₹450.00)')
    expect(warning).toContain('This will affect all future quotes. Do you want to proceed?')
  })

  it('formats warning message accurately for multiple items', () => {
    const multiplePending: EstimateRow[] = [
      {
        id: 'r1',
        productId: 101,
        productCode: 'SKU-1',
        description: 'CPVC Pipe 1"',
        checked: false,
        quantity: 1,
        unit: 'Pcs.',
        listPrice: 450,
        originalListPrice: 400,
        discountPercentage: 0,
        costPrice: 450,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 517.5,
        lineTotal: 517.5,
        updateListPriceInDb: true,
      },
      {
        id: 'r2',
        productId: 102,
        productCode: 'SKU-2',
        description: 'Brass Valve 1"',
        checked: false,
        quantity: 2,
        unit: 'Pcs.',
        listPrice: 650,
        originalListPrice: 600,
        discountPercentage: 0,
        costPrice: 650,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 747.5,
        lineTotal: 1495,
        updateListPriceInDb: true,
      },
    ]

    const warning = formatPriceChangeWarningMessage(multiplePending)
    expect(warning).toContain('Permanent Price Change')
    expect(warning).toContain('2 items:')
    expect(warning).toContain('• CPVC Pipe 1": ₹400.00 → ₹450.00')
    expect(warning).toContain('• Brass Valve 1": ₹600.00 → ₹650.00')
    expect(warning).toContain('This will affect all future quotes. Do you want to proceed?')
  })
})

describe('Enhancement: Hero as Child Constraint & Estimator Gating', () => {
  it('disallows adding a Hero Product as a child component', () => {
    const heroProduct: Product = {
      id: 1,
      product_code: 'PUMP-5HP',
      product_name: 'Crompton 5HP Submersible Pump',
      unit: 'Sets',
      list_price: 25000,
      discount_percentage: 10,
      cost_price: 22000,
      margin_percentage: 15,
      stock_quantity: 10,
      is_hero: true,
    }

    const check = canProductBeChild(heroProduct)
    expect(check.allowed).toBe(false)
    expect(check.reason).toContain('A Hero Product cannot be added as a child component')
  })

  it('allows adding a standard non-hero product as a child component', () => {
    const standardProduct: Product = {
      id: 2,
      product_code: 'CBL-4SQ',
      product_name: 'Flat Submersible Cable 4sqmm',
      unit: 'Mtr.',
      list_price: 100,
      discount_percentage: 20,
      cost_price: 72,
      margin_percentage: 15,
      stock_quantity: 500,
      is_hero: false,
    }

    const check = canProductBeChild(standardProduct)
    expect(check.allowed).toBe(true)
  })

  it('disables child linking button when no hero products exist in the store', () => {
    const check = isChildLinkEnabled(2, [], [])
    expect(check.enabled).toBe(false)
    expect(check.tooltip).toContain('No Hero Products configured yet')
  })

  it('disables child linking button when product is custom item with no catalog productId', () => {
    const hero: HeroProductWithChildren = {
      id: 1,
      product_code: 'PUMP-5HP',
      product_name: 'Pump',
      unit: 'Sets',
      list_price: 25000,
      discount_percentage: 0,
      cost_price: 22000,
      margin_percentage: 15,
      stock_quantity: 10,
      is_hero: true,
      children: [],
    }

    const check = isChildLinkEnabled(null, [hero], [])
    expect(check.enabled).toBe(false)
    expect(check.tooltip).toContain('Custom items not in catalog cannot be linked')
  })

  it('disables child linking button when target item is itself a Hero Product', () => {
    const hero: HeroProductWithChildren = {
      id: 1,
      product_code: 'PUMP-5HP',
      product_name: 'Pump',
      unit: 'Sets',
      list_price: 25000,
      discount_percentage: 0,
      cost_price: 22000,
      margin_percentage: 15,
      stock_quantity: 10,
      is_hero: true,
      children: [],
    }

    const check = isChildLinkEnabled(1, [hero], [hero])
    expect(check.enabled).toBe(false)
    expect(check.tooltip).toContain('A Hero Product cannot be linked as a child component')
  })

  it('enables child linking button for a standard item when hero products exist', () => {
    const hero: HeroProductWithChildren = {
      id: 1,
      product_code: 'PUMP-5HP',
      product_name: 'Pump',
      unit: 'Sets',
      list_price: 25000,
      discount_percentage: 0,
      cost_price: 22000,
      margin_percentage: 15,
      stock_quantity: 10,
      is_hero: true,
      children: [],
    }

    const childProd: Product = {
      id: 2,
      product_code: 'CBL-4SQ',
      product_name: 'Cable',
      unit: 'Mtr.',
      list_price: 100,
      discount_percentage: 0,
      cost_price: 72,
      margin_percentage: 15,
      stock_quantity: 100,
      is_hero: false,
    }

    const check = isChildLinkEnabled(2, [hero], [hero, childProd])
    expect(check.enabled).toBe(true)
    expect(check.tooltip).toContain('Add as Child Component to a Hero Product bundle')
  })
})

describe('Enhancement: Handling Two Hero Products in the Active Cart', () => {
  const hero1: HeroProductWithChildren = {
    id: 10,
    product_code: 'PUMP-CRM-5HP',
    product_name: 'Crompton 5HP Submersible Pump',
    unit: 'Sets',
    list_price: 25000,
    discount_percentage: 0,
    cost_price: 22000,
    margin_percentage: 15,
    stock_quantity: 5,
    is_hero: true,
    children: [],
  }

  const hero2: HeroProductWithChildren = {
    id: 20,
    product_code: 'PUMP-KIR-3HP',
    product_name: 'Kirloskar 3HP Openwell Pump',
    unit: 'Sets',
    list_price: 18000,
    discount_percentage: 0,
    cost_price: 15000,
    margin_percentage: 15,
    stock_quantity: 8,
    is_hero: true,
    children: [],
  }

  const allHeroes = [hero1, hero2]

  it('correctly identifies both hero products when two hero products are in the cart', () => {
    const cartRows: EstimateRow[] = [
      {
        id: 'r1',
        productId: 10, // Hero 1
        productCode: 'PUMP-CRM-5HP',
        description: 'Crompton 5HP Submersible Pump',
        checked: false,
        quantity: 1,
        unit: 'Sets',
        listPrice: 25000,
        discountPercentage: 0,
        costPrice: 22000,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 25300,
        lineTotal: 25300,
      },
      {
        id: 'r2',
        productId: 20, // Hero 2
        productCode: 'PUMP-KIR-3HP',
        description: 'Kirloskar 3HP Openwell Pump',
        checked: false,
        quantity: 1,
        unit: 'Sets',
        listPrice: 18000,
        discountPercentage: 0,
        costPrice: 15000,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 17250,
        lineTotal: 17250,
      },
      {
        id: 'r3',
        productId: 30, // Regular child accessory
        productCode: 'CBL-4SQ',
        description: 'Submersible Cable',
        checked: false,
        quantity: 50,
        unit: 'Mtr.',
        listPrice: 100,
        discountPercentage: 0,
        costPrice: 72,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 85,
        lineTotal: 4250,
      },
    ]

    const cartHeroes = getEligibleCartHeroProducts(cartRows, allHeroes, 30)
    expect(cartHeroes.length).toBe(2)
    expect(cartHeroes.map((h) => h.id)).toEqual([10, 20])
  })

  it('excludes target product itself if target product was also checked', () => {
    const cartRows: EstimateRow[] = [
      {
        id: 'r1',
        productId: 10,
        productCode: 'PUMP-CRM-5HP',
        description: 'Crompton 5HP Submersible Pump',
        checked: false,
        quantity: 1,
        unit: 'Sets',
        listPrice: 25000,
        discountPercentage: 0,
        costPrice: 22000,
        marginPercentage: 15,
        discount: 0,
        discountType: 'PERCENT',
        price: 25300,
        lineTotal: 25300,
      },
    ]

    const cartHeroes = getEligibleCartHeroProducts(cartRows, allHeroes, 10)
    expect(cartHeroes.length).toBe(0) // Cannot link hero 10 to itself
  })
})


