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
app.get('/api/test-db', async (_req, res) => {
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
app.get('/api/customer-types', async (_req, res) => {
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

app.put('/api/customer-types/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const markup = Number(req.body.markup)

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
app.get('/api/customers', async (_req, res) => {
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

app.post('/api/customers', async (req, res) => {
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

app.put('/api/customers/:id', async (req, res) => {
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
app.get('/api/products', async (_req, res) => {
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
        stock_quantity,
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

app.post('/api/products', async (req, res) => {
  try {
    let productCode = String(req.body.productCode ?? '').trim()
    const productName = String(req.body.productName ?? '').trim()
    const unit = String(req.body.unit ?? 'Pcs.').trim()
    const listPrice = Number(req.body.listPrice || 0)
    const discountPercentage = Number(req.body.discountPercentage || 0)
    let costPrice = Number(req.body.costPrice || 0)
    const stockQuantity = Number(req.body.stockQuantity || 100)

    if (!productName) {
      return res.status(400).json({ success: false, message: 'Product name is required' })
    }

    // Auto-generate code if empty
    if (!productCode) {
      const countRes = await db.execute('SELECT COUNT(*) as count FROM products')
      const nextNum = Number(countRes.rows[0].count) + 1
      productCode = `SKU-${String(nextNum).padStart(4, '0')}`
    }

    // Default cost price calculation if 0
    if (costPrice <= 0 && listPrice > 0) {
      costPrice = Number((listPrice * (1 - discountPercentage / 100)).toFixed(2))
    }

    // Check unique code
    const existing = await db.execute({
      sql: `SELECT id FROM products WHERE product_code = ?`,
      args: [productCode],
    })

    if (existing.rows.length > 0) {
      // Append random suffix
      productCode = `${productCode}-${Math.floor(100 + Math.random() * 900)}`
    }

    const result = await db.execute({
      sql: `
        INSERT INTO products 
        (product_code, product_name, unit, list_price, discount_percentage, cost_price, stock_quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [productCode, productName, unit, listPrice, discountPercentage, costPrice, stockQuantity],
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

app.put('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const productCode = String(req.body.productCode ?? '').trim()
    const productName = String(req.body.productName ?? '').trim()
    const unit = String(req.body.unit ?? 'Pcs.').trim()
    const listPrice = Number(req.body.listPrice || 0)
    const discountPercentage = Number(req.body.discountPercentage || 0)
    const costPrice = Number(req.body.costPrice || 0)
    const stockQuantity = Number(req.body.stockQuantity || 0)

    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' })
    }

    if (!productName) {
      return res.status(400).json({ success: false, message: 'Product name is required' })
    }

    await db.execute({
      sql: `
        UPDATE products
        SET product_code = ?, product_name = ?, unit = ?, list_price = ?, discount_percentage = ?, cost_price = ?, stock_quantity = ?
        WHERE id = ?
      `,
      args: [productCode, productName, unit, listPrice, discountPercentage, costPrice, stockQuantity, id],
    })

    res.json({ success: true, message: 'Product updated successfully' })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ success: false, message: 'Failed to update product' })
  }
})

app.delete('/api/products/:id', async (req, res) => {
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
// 5. QUOTATIONS / ESTIMATES
// =====================================================
type EstimateItemInput = {
  productId?: number
  description: string
  quantity: number
  unit?: string
  listPrice?: number
  discountPercentage?: number
  price: number
  lineTotal: number
}

app.post('/api/quotations', async (req, res) => {
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
      const dis = Number(item.discountPercentage || 0)

      let netPrice = Number(item.price)
      if (Number.isNaN(netPrice) || netPrice <= 0) {
        netPrice = listPrice > 0 ? Number((listPrice * (1 - dis / 100)).toFixed(2)) : 0
      }

      // Add tier markup if applicable
      if (markupPercentage > 0) {
        netPrice = Number((netPrice * (1 + markupPercentage / 100)).toFixed(2))
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
        discountPercentage: dis,
        price: netPrice,
        lineTotal,
      }
    })

    const total = Number(subtotal.toFixed(2))
    totalUnits = Number(totalUnits.toFixed(2))

    // Generate Quotation Number
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const countRes = await db.execute('SELECT COUNT(*) as count FROM quotations')
    const nextCount = Number(countRes.rows[0].count) + 1
    const quotationNumber = `EST-${dateStr}-${String(nextCount).padStart(3, '0')}`

    // Insert master quotation
    const quoteResult = await db.execute({
      sql: `
        INSERT INTO quotations 
        (quotation_number, customer_id, customer_type_id, markup_percentage, subtotal, total_units, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [quotationNumber, customerId, customerTypeId, markupPercentage, total, totalUnits, total],
    })

    const quotationId = Number(quoteResult.lastInsertRowid)

    // Insert line items
    for (const item of processedItems) {
      await db.execute({
        sql: `
          INSERT INTO quotation_items 
          (quotation_id, product_id, description, quantity, unit, list_price, discount_percentage, price, line_total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          quotationId,
          item.productId,
          item.description,
          item.quantity,
          item.unit,
          item.listPrice,
          item.discountPercentage,
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

app.get('/api/quotations', async (_req, res) => {
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

app.get('/api/quotations/:id', async (req, res) => {
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