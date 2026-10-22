import { createClient } from '@libsql/client/web'

const DEFAULT_TURSO_URL = 'libsql://quoteflow-db-saivyshnav1027-stack.aws-ap-south-1.turso.io'
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0NDg3MjQsImlkIjoiMDFhMGRmMGMtYmQwMS03OWQ1LTkyYTUtMjE2MDdhN2U1N2M5Iiwia2lkIjoiR2swVEt2LUphQmVGMkxaVHFSV3RDYUltOFE4YnIweHBFVFlDUzJzMXFaayIsInJpZCI6IjUzYTAyNmI5LWQxNmEtNDc2Yi1hYzg3LWFiOTVhMWY1YzNmNCJ9.B44Vmgfr2EWmCJu-h3xorAv7wePo5Sq97Rdhmr0FdYYYSiy2Wrur1kEEW-ALINqb-f_7QnhfOgOTxUNBSY8bBA'

function getDb() {
  return createClient({
    url: DEFAULT_TURSO_URL,
    authToken: DEFAULT_TURSO_TOKEN,
  })
}

export default async function handler(req, res) {
  const method = req.method?.toUpperCase()
  const db = getDb()

  // Ensure tables and column exist
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS hero_product_children (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hero_product_id INTEGER NOT NULL,
        child_product_id INTEGER NOT NULL,
        default_quantity REAL NOT NULL DEFAULT 1.0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hero_product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (child_product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE (hero_product_id, child_product_id)
      )
    `)
  } catch {
    // Ignore table exists
  }

  try {
    await db.execute('ALTER TABLE products ADD COLUMN is_hero INTEGER NOT NULL DEFAULT 0')
  } catch {
    // Ignore column exists
  }

  let { action, id, childMappingId } = req.query || {}

  // Fallback URL parsing for Vercel edge/serverless if query rewrites didn't capture params
  if (!id && req.url) {
    const toggleMatch = req.url.match(/\/api\/hero-products\/(\d+)\/toggle/)
    if (toggleMatch) {
      id = toggleMatch[1]
      action = 'toggle'
    }
    const childrenMatch = req.url.match(/\/api\/hero-products\/(\d+)\/children/)
    if (childrenMatch) {
      id = childrenMatch[1]
      action = 'children'
    }
  }

  if (!childMappingId && req.url) {
    const childMappingMatch = req.url.match(/\/api\/hero-products\/children\/(\d+)/)
    if (childMappingMatch) {
      childMappingId = childMappingMatch[1]
    }
  }

  if (method === 'GET') {
    try {
      const heroesRes = await db.execute(`
        SELECT
          id,
          product_code,
          product_name,
          unit,
          list_price,
          discount_percentage,
          cost_price,
          COALESCE(margin_percentage, 15.0) as margin_percentage,
          stock_quantity,
          COALESCE(is_hero, 0) as is_hero
        FROM products
        WHERE is_hero = 1
        ORDER BY product_name ASC
      `)

      const childrenRes = await db.execute(`
        SELECT
          hpc.id,
          hpc.hero_product_id,
          hpc.child_product_id,
          hpc.default_quantity,
          hpc.created_at,
          p.product_name as child_product_name,
          p.product_code as child_product_code,
          p.unit as child_unit,
          p.cost_price as child_cost_price,
          p.list_price as child_list_price,
          p.discount_percentage as child_discount_percentage,
          COALESCE(p.margin_percentage, 15.0) as child_margin_percentage
        FROM hero_product_children hpc
        JOIN products p ON hpc.child_product_id = p.id
        ORDER BY hpc.id ASC
      `)

      const heroProducts = heroesRes.rows.map((hero) => ({
        ...hero,
        children: childrenRes.rows.filter((c) => Number(c.hero_product_id) === Number(hero.id)),
      }))

      return res.status(200).json(heroProducts)
    } catch (error) {
      console.error('Fetch hero products error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch hero products', error: String(error) })
    }
  }

  if (method === 'POST') {
    // Toggle hero status
    if (action === 'toggle' || req.url?.includes('/toggle')) {
      try {
        const prodId = Number(id || req.body?.id)
        if (!Number.isInteger(prodId)) {
          return res.status(400).json({ success: false, message: 'Invalid product ID' })
        }

        const currentRes = await db.execute({
          sql: `SELECT id, COALESCE(is_hero, 0) as is_hero FROM products WHERE id = ?`,
          args: [prodId],
        })

        if (currentRes.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Product not found' })
        }

        const currentHero = Number(currentRes.rows[0].is_hero) === 1
        const newHeroState = currentHero ? 0 : 1

        await db.execute({
          sql: `UPDATE products SET is_hero = ? WHERE id = ?`,
          args: [newHeroState, prodId],
        })

        return res.status(200).json({
          success: true,
          is_hero: newHeroState === 1,
          message: newHeroState === 1 ? 'Product marked as Hero Product' : 'Product removed from Hero Products',
        })
      } catch (error) {
        console.error('Toggle hero error:', error)
        return res.status(500).json({ success: false, message: 'Failed to toggle hero status', error: String(error) })
      }
    }

    // Add child to hero product
    try {
      const heroId = Number(id || req.body?.heroId)
      const childProductId = Number(req.body?.childProductId)
      const defaultQuantity = Math.max(0.01, Number(req.body?.defaultQuantity) || 1.0)

      if (!Number.isInteger(heroId) || !Number.isInteger(childProductId)) {
        return res.status(400).json({ success: false, message: 'Invalid hero or child product ID' })
      }

      if (heroId === childProductId) {
        return res.status(400).json({ success: false, message: 'A Hero Product cannot be added as its own child component.' })
      }

      // Check hero exists
      const heroCheck = await db.execute({
        sql: `SELECT id, product_name, is_hero FROM products WHERE id = ?`,
        args: [heroId],
      })
      if (heroCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Hero product not found' })
      }

      // Auto promote to hero if needed
      if (Number(heroCheck.rows[0].is_hero) !== 1) {
        await db.execute({
          sql: `UPDATE products SET is_hero = 1 WHERE id = ?`,
          args: [heroId],
        })
      }

      // Check child exists
      const childCheck = await db.execute({
        sql: `SELECT id, product_name, is_hero FROM products WHERE id = ?`,
        args: [childProductId],
      })
      if (childCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Child product not found' })
      }

      // Constraint: A Hero Product cannot be added as a child of another Hero Product
      if (Number(childCheck.rows[0].is_hero) === 1) {
        return res.status(400).json({
          success: false,
          message: 'A Hero Product cannot be added as a child component of another Hero Product.',
        })
      }

      // Check circular references
      const circularCheck = await db.execute({
        sql: `SELECT id FROM hero_product_children WHERE hero_product_id = ? AND child_product_id = ?`,
        args: [childProductId, heroId],
      })
      if (circularCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Circular reference detected: this child product is already a Hero parent of the selected product.',
        })
      }

      // Check duplicate
      const duplicateCheck = await db.execute({
        sql: `SELECT id FROM hero_product_children WHERE hero_product_id = ? AND child_product_id = ?`,
        args: [heroId, childProductId],
      })

      if (duplicateCheck.rows.length > 0) {
        const existingId = Number(duplicateCheck.rows[0].id)
        await db.execute({
          sql: `UPDATE hero_product_children SET default_quantity = ? WHERE id = ?`,
          args: [defaultQuantity, existingId],
        })
        return res.status(200).json({
          success: true,
          message: `Updated default quantity to ${defaultQuantity} for ${childCheck.rows[0].product_name}`,
          id: existingId,
          alreadyExisted: true,
        })
      }

      const insertRes = await db.execute({
        sql: `INSERT INTO hero_product_children (hero_product_id, child_product_id, default_quantity) VALUES (?, ?, ?)`,
        args: [heroId, childProductId, defaultQuantity],
      })

      return res.status(201).json({
        success: true,
        message: `Added ${childCheck.rows[0].product_name} as child component to ${heroCheck.rows[0].product_name}`,
        id: Number(insertRes.lastInsertRowid),
      })
    } catch (error) {
      console.error('Add child error:', error)
      return res.status(500).json({ success: false, message: 'Failed to add child product', error: String(error) })
    }
  }

  if (method === 'DELETE') {
    try {
      const mappingId = Number(childMappingId || req.body?.childMappingId || id)
      if (!Number.isInteger(mappingId)) {
        return res.status(400).json({ success: false, message: 'Invalid mapping ID' })
      }

      await db.execute({
        sql: `DELETE FROM hero_product_children WHERE id = ?`,
        args: [mappingId],
      })

      return res.status(200).json({ success: true, message: 'Child product removed successfully' })
    } catch (error) {
      console.error('Delete child error:', error)
      return res.status(500).json({ success: false, message: 'Failed to remove child product' })
    }
  }

  if (method === 'PUT') {
    try {
      const mappingId = Number(childMappingId || req.body?.childMappingId || id)
      const defaultQuantity = Math.max(0.01, Number(req.body?.defaultQuantity) || 1.0)

      if (!Number.isInteger(mappingId)) {
        return res.status(400).json({ success: false, message: 'Invalid mapping ID' })
      }

      await db.execute({
        sql: `UPDATE hero_product_children SET default_quantity = ? WHERE id = ?`,
        args: [defaultQuantity, mappingId],
      })

      return res.status(200).json({ success: true, message: 'Default quantity updated successfully' })
    } catch (error) {
      console.error('Update child error:', error)
      return res.status(500).json({ success: false, message: 'Failed to update child quantity' })
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' })
}
