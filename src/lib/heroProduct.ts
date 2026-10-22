import type { EstimateRow, HeroProductWithChildren, Product } from '../types'

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
 * Pure helper detecting whether saving an estimate requires the explicit confirmation modal
 */
export function getPendingDbPriceUpdates(rows: EstimateRow[]): EstimateRow[] {
  return rows.filter(shouldUpdateProductListPriceInDb)
}

/**
 * Pure helper formatting the explicit permanent price change confirmation warning
 */
export function formatPriceChangeWarningMessage(rowsToUpdate: EstimateRow[]): string {
  const isSingle = rowsToUpdate.length === 1
  const itemDescription = isSingle
    ? `1 item (e.g. ${rowsToUpdate[0].description}: ₹${Number(rowsToUpdate[0].originalListPrice ?? rowsToUpdate[0].listPrice).toFixed(2)} → ₹${Number(rowsToUpdate[0].listPrice).toFixed(2)})`
    : `${rowsToUpdate.length} items:\n\n` +
      rowsToUpdate
        .map(
          (r) =>
            `• ${r.description}: ₹${Number(r.originalListPrice ?? r.listPrice).toFixed(2)} → ₹${Number(r.listPrice).toFixed(2)}`
        )
        .join('\n')

  return `⚠️ Permanent Price Change: You are about to update the master catalog price for ${itemDescription}. This will affect all future quotes. Do you want to proceed?`
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

/**
 * Rule: Cannot add another Hero Product as a child component
 */
export function canProductBeChild(product: { id: number; is_hero?: boolean | number }): {
  allowed: boolean
  reason?: string
} {
  const isHero = Boolean(product.is_hero) || Number(product.is_hero) === 1
  if (isHero) {
    return {
      allowed: false,
      reason: 'A Hero Product cannot be added as a child component of another Hero Product.',
    }
  }
  return { allowed: true }
}

/**
 * Rule: Gate child linking button in Estimator
 * Only enable when hero products exist and target row is not itself a hero product
 */
export function isChildLinkEnabled(
  productId: number | null,
  heroProducts: HeroProductWithChildren[],
  allProducts: Product[]
): { enabled: boolean; tooltip: string } {
  if (!productId) {
    return {
      enabled: false,
      tooltip: 'Custom items not in catalog cannot be linked to a Hero Product.',
    }
  }

  if (!heroProducts || heroProducts.length === 0) {
    return {
      enabled: false,
      tooltip: 'No Hero Products configured yet. Mark a product as Hero in the catalog first.',
    }
  }

  const prod = allProducts.find((p) => p.id === productId)
  const isHero = Boolean(prod?.is_hero) || heroProducts.some((h) => h.id === productId)
  if (isHero) {
    return {
      enabled: false,
      tooltip: 'A Hero Product cannot be linked as a child component.',
    }
  }

  return {
    enabled: true,
    tooltip: 'Add as Child Component to a Hero Product bundle',
  }
}

/**
 * Extracts and filters Hero Products present in the active cart
 */
export function getEligibleCartHeroProducts(
  cartRows: EstimateRow[],
  heroProducts: HeroProductWithChildren[],
  targetProductId?: number | null
): HeroProductWithChildren[] {
  const cartProductIds = new Set(
    cartRows.map((r) => r.productId).filter((id): id is number => id !== null && id !== undefined)
  )

  return heroProducts.filter(
    (h) => cartProductIds.has(h.id) && (targetProductId === undefined || h.id !== targetProductId)
  )
}
