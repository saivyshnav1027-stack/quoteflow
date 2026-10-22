import express from 'express'
import cors from 'cors'
import { db, isUsingTurso } from './db.js'
import { initSchema } from './schema.js'

const app = express()

app.use(cors())
app.use(express.json())

// Ensure schema is initialized on boot
initSchema().catch((err) => console.error('[DB Boot Init Error]', err))

// =====================================================
// 1. HEALTH / DATABASE STATUS
// =====================================================
app.get(['/api/test-db', '/test-db'], async (_req, res) => {
  try {
    const result = await db.execute('SELECT 1 AS connected')
    res.json({
      success: true,
      message: isUsingTurso
        ? 'QuoteFlow connected to Turso Cloud DB successfully!'
        : 'QuoteFlow connected to Local SQLite (file:local.db) successfully!',
      isUsingTurso,
      result: result.rows,
    })
  } catch (error) {
    console.error('Database connection error:', error)
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: String(error),
    })
  }
})

// =====================================================
// 2. CUSTOMER TYPES (TIERS)
// =====================================================
app.get(['/api/customer-types', '/customer-types'], async (_req, res) => {
  try {
    const result = await db.execute(`
      SELECT id, type_name, markup_percentage
      FROM customer_types
      ORDER BY id
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Fetch customer types error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch customer types' })
  }
})

app.put(['/api/customer-types/:id', '/customer-types/:id'], async (req, res) => {
  try {
    const id = Number(req.params.id)
    const rawMarkup = req.body?.markup !== undefined ? req.body.markup : req.body?.markupPercentage
    const markup = Number(rawMarkup !== undefined ? rawMarkup : 0)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer type ID' })
    }

    if (Number.isNaN(markup)) {
      return res.status(400).json({ success: false, message: 'Invalid markup percentage' })
    }

    await db.execute({
      sql: `UPDATE customer_types SET markup_percentage = ? WHERE id = ?`,
      args: [markup, id],
    })

    const result = await db.execute({
      sql: `SELECT id, type_name, markup_percentage FROM customer_types WHERE id = ?`,
      args: [id],
    })

    res.json({ success: true, customerType: result.rows[0] })
  } catch (error) {
    console.error('Update customer type error:', error)
    res.status(500).json({ success: false, message: 'Failed to update customer type' })
  }
})

// =====================================================
// 3. CUSTOMERS
// =====================================================
app.get(['/api/customers', '/customers'], async (_req, res) => {
  try {
    const result = await db.execute(`
      SELECT
        c.id,
        c.customer_name,
        c.phone,
        c.customer_type_id,
        ct.type_name,
        ct.markup_percentage
      FROM customers c
      LEFT JOIN customer_types ct ON c.customer_type_id = ct.id
      ORDER BY c.id DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Fetch customers error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch customers' })
  }
})

app.post(['/api/customers', '/customers'], async (req, res) => {
  try {
    const customerName = String(req.body.customerName ?? '').trim()
    const phone = String(req.body.phone ?? '').trim()
    const customerTypeId = Number(req.body.customerTypeId || 1)

    if (!customerName) {
      return res.status(400).json({ success: false, message: 'Customer name is required' })
    }

    const result = await db.execute({
      sql: `INSERT INTO customers (customer_name, phone, customer_type_id) VALUES (?, ?, ?)`,
      args: [customerName, phone, customerTypeId],
    })

    const createdId = Number(result.lastInsertRowid)

    const fetchResult = await db.execute({
      sql: `
        SELECT c.id, c.customer_name, c.phone, c.customer_type_id, ct.type_name, ct.markup_percentage
        FROM customers c
        LEFT JOIN customer_types ct ON c.customer_type_id = ct.id
        WHERE c.id = ?
      `,
      args: [createdId],
    })

    res.status(201).json({
      success: true,
      customer: fetchResult.rows[0],
    })
  } catch (error) {
    console.error('Create customer error:', error)
    res.status(500).json({ success: false, message: 'Failed to create customer' })
  }
})

app.put(['/api/customers/:id', '/customers/:id'], async (req, res) => {
  try {
    const id = Number(req.params.id)
    const customerName = String(req.body.customerName ?? '').trim()
    const phone = String(req.body.phone ?? '').trim()
    const customerTypeId = Number(req.body.customerTypeId || 1)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' })
    }

    if (!customerName) {
      return res.status(400).json({ success: false, message: 'Customer name is required' })
    }

    await db.execute({
      sql: `UPDATE customers SET customer_name = ?, phone = ?, customer_type_id = ? WHERE id = ?`,
      args: [customerName, phone, customerTypeId, id],
    })

    res.json({ success: true, message: 'Customer updated successfully' })
  } catch (error) {
    console.error('Update customer error:', error)
    res.status(500).json({ success: false, message: 'Failed to update customer' })
  }
})

// =====================================================
// 4. PRODUCTS (INVENTORY)
// =====================================================
app.get(['/api/products', '/products'], async (_req, res) => {
  try {
    const result = await db.execute(`
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
        COALESCE(is_hero, 0) as is_hero,
        created_at
      FROM products
      ORDER BY id DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Fetch products error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch products' })
  }
})

app.post(['/api/products', '/products'], async (req, res) => {
  try {
    let productCode = String(req.body.productCode ?? '').trim()
    const productName = String(req.body.productName ?? '').trim()
    const unit = String(req.body.unit ?? 'Pcs.').trim()
    const listPrice = Number(req.body.listPrice || 0)
    const discountPercentage = Number(req.body.discountPercentage || 0)
    let costPrice = Number(req.body.costPrice || 0)
    const marginPercentage = Number(req.body.marginPercentage ?? req.body.margin_percentage ?? 15)
    const stockQuantity = Number(req.body.stockQuantity || 100)

    if (!productName) {
      return res.status(400).json({ success: false, message: 'Product name is required' })
    }

    if (!productCode) {
      const countRes = await db.execute('SELECT COUNT(*) as count FROM products')
      const nextNum = Number(countRes.rows[0].count) + 1
      productCode = `SKU-${String(nextNum).padStart(4, '0')}`
    }

    if (costPrice <= 0 && listPrice > 0) {
      costPrice = Number((listPrice * (1 - discountPercentage / 100)).toFixed(2))
    }

    const existing = await db.execute({
      sql: `SELECT id FROM products WHERE product_code = ?`,
      args: [productCode],
    })

    if (existing.rows.length > 0) {
      productCode = `${productCode}-${Math.floor(100 + Math.random() * 900)}`
    }

    const result = await db.execute({
      sql: `
        INSERT INTO products 
        (product_code, product_name, unit, list_price, discount_percentage, cost_price, margin_percentage, stock_quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [productCode, productName, unit, listPrice, discountPercentage, costPrice, marginPercentage, stockQuantity],
    })

    const newId = Number(result.lastInsertRowid)
    const fetchRes = await db.execute({
      sql: `SELECT * FROM products WHERE id = ?`,
      args: [newId],
    })

    res.status(201).json({
      success: true,
      product: fetchRes.rows[0],
    })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ success: false, message: 'Failed to create product' })
  }
})

app.put(['/api/products/:id', '/products/:id'], async (req, res) => {
  try {
    const id = Number(req.params.id)
    const productCode = String(req.body.productCode ?? '').trim()
    const productName = String(req.body.productName ?? '').trim()
    const unit = String(req.body.unit ?? 'Pcs.').trim()
    const listPrice = Number(req.body.listPrice || 0)
    const discountPercentage = Number(req.body.discountPercentage || 0)
    let costPrice = Number(req.body.costPrice || 0)
    const marginPercentage = Number(req.body.marginPercentage ?? req.body.margin_percentage ?? 15)
    const stockQuantity = Number(req.body.stockQuantity || 0)

    if (costPrice <= 0 && listPrice > 0) {
      costPrice = Number((listPrice * (1 - discountPercentage / 100)).toFixed(2))
    }

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' })
    }

    if (!productName) {
      return res.status(400).json({ success: false, message: 'Product name is required' })
    }

    await db.execute({
      sql: `
        UPDATE products
        SET product_code = ?, product_name = ?, unit = ?, list_price = ?, discount_percentage = ?, cost_price = ?, margin_percentage = ?, stock_quantity = ?
        WHERE id = ?
      `,
      args: [productCode, productName, unit, listPrice, discountPercentage, costPrice, marginPercentage, stockQuantity, id],
    })

    res.json({ success: true, message: 'Product updated successfully' })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ success: false, message: 'Failed to update product' })
  }
})

app.delete(['/api/products/:id', '/products/:id'], async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' })
    }

    await db.execute({
      sql: `DELETE FROM products WHERE id = ?`,
      args: [id],
    })

    res.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete product' })
  }
})

// =====================================================
// 4.5. HERO PRODUCTS & CHILD COMPONENTS
// =====================================================
app.get(['/api/hero-products', '/hero-products'], async (_req, res) => {
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

    const heroProducts = heroesRes.rows.map((hero: any) => ({
      ...hero,
      children: childrenRes.rows.filter((c: any) => Number(c.hero_product_id) === Number(hero.id)),
    }))

    res.json(heroProducts)
  } catch (error) {
    console.error('Fetch hero products error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch hero products', error: String(error) })
  }
})

app.post(['/api/hero-products/:id/toggle', '/hero-products/:id/toggle'], async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' })
    }

    const currentRes = await db.execute({
      sql: `SELECT id, COALESCE(is_hero, 0) as is_hero FROM products WHERE id = ?`,
      args: [id],
    })

    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    const currentHero = Number(currentRes.rows[0].is_hero) === 1
    const newHeroState = currentHero ? 0 : 1

    await db.execute({
      sql: `UPDATE products SET is_hero = ? WHERE id = ?`,
      args: [newHeroState, id],
    })

    res.json({
      success: true,
      is_hero: newHeroState === 1,
      message: newHeroState === 1 ? 'Product marked as Hero Product' : 'Product removed from Hero Products',
    })
  } catch (error) {
    console.error('Toggle hero product error:', error)
    res.status(500).json({ success: false, message: 'Failed to toggle hero status', error: String(error) })
  }
})

app.post(['/api/hero-products/:id/children', '/hero-products/:id/children'], async (req, res) => {
  try {
    const heroId = Number(req.params.id)
    const childProductId = Number(req.body.childProductId)
    const defaultQuantity = Math.max(0.01, Number(req.body.defaultQuantity) || 1.0)

    if (!Number.isInteger(heroId) || !Number.isInteger(childProductId)) {
      return res.status(400).json({ success: false, message: 'Invalid hero or child product ID' })
    }

    if (heroId === childProductId) {
      return res.status(400).json({ success: false, message: 'A Hero Product cannot be added as its own child component.' })
    }

    // Ensure hero product exists
    const heroCheck = await db.execute({
      sql: `SELECT id, product_name, is_hero FROM products WHERE id = ?`,
      args: [heroId],
    })
    if (heroCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hero product not found' })
    }

    // Auto-promote to Hero Product if not already marked
    if (Number(heroCheck.rows[0].is_hero) !== 1) {
      await db.execute({
        sql: `UPDATE products SET is_hero = 1 WHERE id = ?`,
        args: [heroId],
      })
    }

    // Check if target child product exists
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

    // Check circular references: is heroId already a child of childProductId?
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

    // Check if relationship already exists
    const duplicateCheck = await db.execute({
      sql: `SELECT id FROM hero_product_children WHERE hero_product_id = ? AND child_product_id = ?`,
      args: [heroId, childProductId],
    })

    if (duplicateCheck.rows.length > 0) {
      // Update quantity on existing relationship
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

    res.status(201).json({
      success: true,
      message: `Added ${childCheck.rows[0].product_name} as child component to ${heroCheck.rows[0].product_name}`,
      id: Number(insertRes.lastInsertRowid),
    })
  } catch (error) {
    console.error('Add child to hero error:', error)
    res.status(500).json({ success: false, message: 'Failed to add child product', error: String(error) })
  }
})

app.delete(['/api/hero-products/children/:childMappingId', '/hero-products/children/:childMappingId'], async (req, res) => {
  try {
    const id = Number(req.params.childMappingId)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid mapping ID' })
    }

    await db.execute({
      sql: `DELETE FROM hero_product_children WHERE id = ?`,
      args: [id],
    })

    res.json({ success: true, message: 'Child product removed successfully' })
  } catch (error) {
    console.error('Delete child mapping error:', error)
    res.status(500).json({ success: false, message: 'Failed to remove child product' })
  }
})

app.put(['/api/hero-products/children/:childMappingId', '/hero-products/children/:childMappingId'], async (req, res) => {
  try {
    const id = Number(req.params.childMappingId)
    const defaultQuantity = Math.max(0.01, Number(req.body.defaultQuantity) || 1.0)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid mapping ID' })
    }

    await db.execute({
      sql: `UPDATE hero_product_children SET default_quantity = ? WHERE id = ?`,
      args: [defaultQuantity, id],
    })

    res.json({ success: true, message: 'Default quantity updated successfully' })
  } catch (error) {
    console.error('Update child mapping error:', error)
    res.status(500).json({ success: false, message: 'Failed to update child quantity' })
  }
})

// =====================================================
// 5. QUOTATIONS / ESTIMATES
// =====================================================
type EstimateItemInput = {
  productId?: number
  description: string
  quantity: number
  unit?: string
  listPrice?: number
  discountPercentage?: number
  costPrice?: number
  cost_price?: number
  marginPercentage?: number
  margin_percentage?: number
  discount?: number
  discountType?: string
  discount_type?: string
  price: number
  lineTotal: number
}

app.post(['/api/quotations', '/quotations'], async (req, res) => {
  try {
    const customerId = req.body.customerId ? Number(req.body.customerId) : null
    const customerName = String(req.body.customerName || 'Guest Walk-In')
    const customerPhone = String(req.body.customerPhone || '')
    const customerTypeId = req.body.customerTypeId ? Number(req.body.customerTypeId) : 1
    const markupPercentage = Number(req.body.markupPercentage || 0)
    const items: EstimateItemInput[] = req.body.items

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' })
    }

    let subtotal = 0
    let totalUnits = 0

    const processedItems = items.map((item) => {
      const qty = Number(item.quantity || 1)
      const listPrice = Number(item.listPrice || 0)
      const discountPercentage = Number(item.discountPercentage || 0)
      const costPrice = Number(item.costPrice ?? item.cost_price ?? 0)
      const marginPercentage = Number(item.marginPercentage ?? item.margin_percentage ?? 0)
      const discount = Number(item.discount ?? 0)
      const discountType = String(item.discountType ?? item.discount_type ?? 'PERCENT').toUpperCase()

      let netPrice = Number(item.price)
      if (Number.isNaN(netPrice) || netPrice <= 0) {
        if (costPrice > 0) {
          const priceAfterMargin = Number((costPrice * (1 + marginPercentage / 100)).toFixed(2))
          if (discountType === 'FLAT' || discountType === 'RUPEE' || discountType === 'AMOUNT') {
            netPrice = Number(Math.max(0, priceAfterMargin - discount).toFixed(2))
          } else {
            netPrice = Number((priceAfterMargin * (1 - discount / 100)).toFixed(2))
          }
        } else {
          let base = listPrice > 0 ? Number((listPrice * (1 - discountPercentage / 100)).toFixed(2)) : 0
          if (markupPercentage > 0) {
            base = Number((base * (1 + markupPercentage / 100)).toFixed(2))
          }
          netPrice = base
        }
      }

      const lineTotal = Number((netPrice * qty).toFixed(2))

      subtotal += lineTotal
      totalUnits += qty

      return {
        productId: item.productId || null,
        description: item.description || 'Custom Item',
        quantity: qty,
        unit: item.unit || 'Pcs.',
        listPrice,
        discountPercentage,
        costPrice,
        marginPercentage,
        discount,
        discountType,
        price: netPrice,
        lineTotal,
      }
    })

    const total = Number(subtotal.toFixed(2))
    totalUnits = Number(totalUnits.toFixed(2))

    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const datePrefix = `${yy}${mm}${dd}`

    // Find highest existing quotation sequence for today to avoid collisions
    const quotesRes = await db.execute('SELECT quotation_number FROM quotations')
    const existingNumbers = new Set<string>()
    let maxSeq = 0

    for (const row of quotesRes.rows) {
      const numStr = String(row.quotation_number || '').trim()
      existingNumbers.add(numStr)

      const regex = new RegExp(`^(?:EST-)?${datePrefix}A(\\d+)$`, 'i')
      const match = numStr.match(regex)
      if (match) {
        const seq = parseInt(match[1], 10)
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq
        }
      }
    }

    let quotationNumber = req.body.quotationNumber ? String(req.body.quotationNumber).trim() : ''
    if (!quotationNumber || existingNumbers.has(quotationNumber)) {
      quotationNumber = `${datePrefix}A${maxSeq + 1}`
    }

    let validCustomerId: number | null = null
    if (customerId) {
      const custCheck = await db.execute({
        sql: 'SELECT id FROM customers WHERE id = ?',
        args: [customerId],
      })
      if (custCheck.rows.length > 0) {
        validCustomerId = customerId
      }
    }

    let validCustomerTypeId: number | null = null
    if (customerTypeId) {
      const typeCheck = await db.execute({
        sql: 'SELECT id FROM customer_types WHERE id = ?',
        args: [customerTypeId],
      })
      if (typeCheck.rows.length > 0) {
        validCustomerTypeId = customerTypeId
      }
    }

    const quoteResult = await db.execute({
      sql: `
        INSERT INTO quotations 
        (quotation_number, customer_id, customer_type_id, markup_percentage, subtotal, total_units, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [quotationNumber, validCustomerId, validCustomerTypeId, markupPercentage, total, totalUnits, total],
    })

    const quotationId = Number(quoteResult.lastInsertRowid)

    for (const item of processedItems) {
      let validProductId: number | null = null
      if (item.productId) {
        const prodCheck = await db.execute({
          sql: 'SELECT id FROM products WHERE id = ?',
          args: [item.productId],
        })
        if (prodCheck.rows.length > 0) {
          validProductId = item.productId
        }
      }

      await db.execute({
        sql: `
          INSERT INTO quotation_items 
          (quotation_id, product_id, description, quantity, unit, list_price, discount_percentage, cost_price, margin_percentage, discount, discount_type, price, line_total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          quotationId,
          validProductId,
          item.description,
          item.quantity,
          item.unit,
          item.listPrice,
          item.discountPercentage,
          item.costPrice,
          item.marginPercentage,
          item.discount,
          item.discountType,
          item.price,
          item.lineTotal,
        ],
      })
    }

    res.status(201).json({
      success: true,
      message: 'Quotation generated successfully',
      quotation: {
        id: quotationId,
        quotationNumber,
        customerId,
        customerName,
        customerPhone,
        customerTypeId,
        markupPercentage,
        subtotal: total,
        totalUnits,
        total,
        createdAt: now.toISOString(),
        items: processedItems,
      },
    })
  } catch (error) {
    console.error('Create quotation error:', error)
    res.status(500).json({ success: false, message: 'Failed to create quotation' })
  }
})

app.get(['/api/quotations', '/quotations'], async (_req, res) => {
  try {
    const result = await db.execute(`
      SELECT
        q.id,
        q.quotation_number,
        q.customer_id,
        COALESCE(c.customer_name, 'Guest Walk-In') AS customer_name,
        COALESCE(c.phone, '') AS phone,
        q.subtotal,
        q.total_units,
        q.total,
        q.created_at,
        COUNT(qi.id) AS item_count
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
      GROUP BY q.id
      ORDER BY q.id DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Fetch quotations error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch quotation history' })
  }
})

app.get(['/api/quotations/:id', '/quotations/:id'], async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid quotation ID' })
    }

    const quoteRes = await db.execute({
      sql: `
        SELECT
          q.id,
          q.quotation_number,
          q.customer_id,
          COALESCE(c.customer_name, 'Guest Walk-In') AS customer_name,
          COALESCE(c.phone, '') AS phone,
          q.markup_percentage,
          q.subtotal,
          q.total_units,
          q.total,
          q.created_at
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        WHERE q.id = ?
      `,
      args: [id],
    })

    if (quoteRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }

    const itemsRes = await db.execute({
      sql: `
        SELECT
          id,
          product_id,
          description,
          quantity,
          unit,
          list_price,
          discount_percentage,
          price,
          line_total
        FROM quotation_items
        WHERE quotation_id = ?
        ORDER BY id ASC
      `,
      args: [id],
    })

    res.json({
      success: true,
      quotation: {
        ...quoteRes.rows[0],
        items: itemsRes.rows,
      },
    })
  } catch (error) {
    console.error('Fetch quotation details error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch quotation details' })
  }
})

app.put(['/api/quotations/:id', '/quotations/:id'], async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid quotation ID' })
    }

    const quoteCheck = await db.execute({
      sql: 'SELECT id, quotation_number FROM quotations WHERE id = ?',
      args: [id],
    })

    if (quoteCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }

    const existingQuotationNumber = String(quoteCheck.rows[0].quotation_number)

    const customerId = req.body.customerId ? Number(req.body.customerId) : null
    const customerName = String(req.body.customerName || 'Guest Walk-In')
    const customerPhone = String(req.body.customerPhone || '')
    const customerTypeId = req.body.customerTypeId ? Number(req.body.customerTypeId) : 1
    const markupPercentage = Number(req.body.markupPercentage || 0)
    const items = req.body.items || []

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' })
    }

    let subtotal = 0
    let totalUnits = 0

    const processedItems = items.map((item: any) => {
      const qty = Number(item.quantity || 1)
      const listPrice = Number(item.listPrice || 0)
      const discountPercentage = Number(item.discountPercentage || 0)
      const costPrice = Number(item.costPrice ?? item.cost_price ?? 0)
      const marginPercentage = Number(item.marginPercentage ?? item.margin_percentage ?? 0)
      const discount = Number(item.discount ?? 0)
      const discountType = String(item.discountType ?? item.discount_type ?? 'PERCENT').toUpperCase()

      let netPrice = Number(item.price)
      if (Number.isNaN(netPrice) || netPrice <= 0) {
        if (costPrice > 0) {
          const priceAfterMargin = Number((costPrice * (1 + marginPercentage / 100)).toFixed(2))
          if (discountType === 'FLAT' || discountType === 'RUPEE' || discountType === 'AMOUNT') {
            netPrice = Number(Math.max(0, priceAfterMargin - discount).toFixed(2))
          } else {
            netPrice = Number((priceAfterMargin * (1 - discount / 100)).toFixed(2))
          }
        } else {
          let base = listPrice > 0 ? Number((listPrice * (1 - discountPercentage / 100)).toFixed(2)) : 0
          if (markupPercentage > 0) {
            base = Number((base * (1 + markupPercentage / 100)).toFixed(2))
          }
          netPrice = base
        }
      }

      const lineTotal = Number((netPrice * qty).toFixed(2))
      subtotal += lineTotal
      totalUnits += qty

      return {
        productId: item.productId || null,
        description: item.description || 'Custom Item',
        quantity: qty,
        unit: item.unit || 'Pcs.',
        listPrice,
        discountPercentage,
        costPrice,
        marginPercentage,
        discount,
        discountType,
        price: netPrice,
        lineTotal,
      }
    })

    const total = Number(subtotal.toFixed(2))
    totalUnits = Number(totalUnits.toFixed(2))

    let validCustomerId: number | null = null
    if (customerId) {
      const custCheck = await db.execute({
        sql: 'SELECT id FROM customers WHERE id = ?',
        args: [customerId],
      })
      if (custCheck.rows.length > 0) {
        validCustomerId = customerId
      }
    }

    let validCustomerTypeId: number | null = null
    if (customerTypeId) {
      const typeCheck = await db.execute({
        sql: 'SELECT id FROM customer_types WHERE id = ?',
        args: [customerTypeId],
      })
      if (typeCheck.rows.length > 0) {
        validCustomerTypeId = customerTypeId
      }
    }

    await db.execute({
      sql: `
        UPDATE quotations 
        SET customer_id = ?, customer_type_id = ?, markup_percentage = ?, subtotal = ?, total_units = ?, total = ?
        WHERE id = ?
      `,
      args: [validCustomerId, validCustomerTypeId, markupPercentage, total, totalUnits, total, id],
    })

    await db.execute({
      sql: `DELETE FROM quotation_items WHERE quotation_id = ?`,
      args: [id],
    })

    for (const item of processedItems) {
      let validProductId: number | null = null
      if (item.productId) {
        const prodCheck = await db.execute({
          sql: 'SELECT id FROM products WHERE id = ?',
          args: [item.productId],
        })
        if (prodCheck.rows.length > 0) {
          validProductId = item.productId
        }
      }

      await db.execute({
        sql: `
          INSERT INTO quotation_items 
          (quotation_id, product_id, description, quantity, unit, list_price, discount_percentage, cost_price, margin_percentage, discount, discount_type, price, line_total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id,
          validProductId,
          item.description,
          item.quantity,
          item.unit,
          item.listPrice,
          item.discountPercentage,
          item.costPrice,
          item.marginPercentage,
          item.discount,
          item.discountType,
          item.price,
          item.lineTotal,
        ],
      })
    }

    res.json({
      success: true,
      message: 'Quotation updated successfully',
      quotation: {
        id,
        quotationNumber: existingQuotationNumber,
        customerId,
        customerName,
        customerPhone,
        customerTypeId,
        markupPercentage,
        subtotal: total,
        totalUnits,
        total,
        items: processedItems,
      },
    })
  } catch (error) {
    console.error('Update quotation error:', error)
    res.status(500).json({ success: false, message: 'Failed to update quotation' })
  }
})

app.delete(['/api/quotations/:id', '/quotations/:id'], async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid quotation ID' })
    }

    // Delete child items first to maintain referential integrity
    await db.execute({
      sql: `DELETE FROM quotation_items WHERE quotation_id = ?`,
      args: [id],
    })

    const result = await db.execute({
      sql: `DELETE FROM quotations WHERE id = ?`,
      args: [id],
    })

    res.json({
      success: true,
      message: 'Quotation deleted successfully',
      rowsAffected: result.rowsAffected,
    })
  } catch (error) {
    console.error('Delete quotation error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete quotation' })
  }
})

app.delete(['/api/quotations', '/quotations'], async (req, res) => {
  try {
    const timeline = String(req.query.timeline || req.body?.timeline || '').toLowerCase()
    const olderThanDays = req.query.olderThanDays ? Number(req.query.olderThanDays) : null

    let matchingSql = `SELECT id FROM quotations`
    let args: any[] = []

    if (timeline === 'weekly' || olderThanDays === 7) {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      matchingSql += ` WHERE created_at < ? OR datetime(created_at) < datetime('now', '-7 days')`
      args = [cutoff]
    } else if (timeline === 'monthly' || olderThanDays === 30) {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      matchingSql += ` WHERE created_at < ? OR datetime(created_at) < datetime('now', '-30 days')`
      args = [cutoff]
    } else if (timeline === 'all') {
      // Purge all records
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid timeline. Specify timeline=weekly, monthly, or all',
      })
    }

    const matches = await db.execute({
      sql: matchingSql,
      args,
    })

    const ids = matches.rows.map((r: any) => Number(r.id)).filter((id: number) => Number.isInteger(id))

    if (ids.length === 0) {
      return res.json({
        success: true,
        deletedCount: 0,
        message: 'No estimates found matching the specified timeline',
      })
    }

    const placeholders = ids.map(() => '?').join(',')
    await db.execute({
      sql: `DELETE FROM quotation_items WHERE quotation_id IN (${placeholders})`,
      args: ids,
    })

    await db.execute({
      sql: `DELETE FROM quotations WHERE id IN (${placeholders})`,
      args: ids,
    })

    res.json({
      success: true,
      deletedCount: ids.length,
      message: `Successfully deleted ${ids.length} estimate(s)`,
    })
  } catch (error) {
    console.error('Purge quotations error:', error)
    res.status(500).json({ success: false, message: 'Failed to purge quotations' })
  }
})

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 3000

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[QuoteFlow] Sri Venkateshwara Trading Backend running on http://localhost:${PORT}`)
  })
}

export default app