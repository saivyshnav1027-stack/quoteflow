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

  if (method === 'GET') {
    try {
      const result = await db.execute(`
        SELECT id, product_code, product_name, unit, list_price, discount_percentage, cost_price, COALESCE(margin_percentage, 15.0) as margin_percentage, stock_quantity, COALESCE(is_hero, 0) as is_hero
        FROM products
        ORDER BY product_name ASC
      `)
      return res.status(200).json(result.rows)
    } catch (error) {
      console.error('Fetch products error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch products', error: String(error) })
    }
  }

  if (method === 'POST') {
    try {
      const body = req.body || {}

      // Bulk Upload Batch Handler (chunks of 100)
      if (req.query?.action === 'bulk' || body?.action === 'bulk' || Array.isArray(body?.items)) {
        const items = Array.isArray(body?.items) ? body.items : []
        if (items.length === 0) {
          return res.status(400).json({ success: false, message: 'No items provided for bulk upload' })
        }

        const countRes = await db.execute('SELECT COUNT(*) as count FROM products')
        let currentCount = Number(countRes.rows[0].count)

        const statements = items.map((item) => {
          let code = String(item.productCode ?? item.product_code ?? '').trim().toUpperCase()
          if (!code) {
            currentCount++
            code = `SKU-${String(currentCount).padStart(4, '0')}`
          }
          const name = String(item.productName ?? item.product_name ?? '').trim()
          const unit = String(item.unit ?? 'Pcs.').trim()
          const listPrice = Number(item.listPrice ?? item.list_price ?? 0)
          const discountPercentage = Number(item.discountPercentage ?? item.discount_percentage ?? 0)
          let costPrice = Number(item.costPrice ?? item.cost_price ?? 0)
          if (costPrice <= 0 && listPrice > 0) {
            costPrice = Number((listPrice * (1 - discountPercentage / 100)).toFixed(2))
          }
          const marginPercentage = Number(item.marginPercentage ?? item.margin_percentage ?? 15)
          const stockQuantity = Number(item.stockQuantity ?? item.stock_quantity ?? 100)

          return {
            sql: `
              INSERT INTO products 
              (product_code, product_name, unit, list_price, discount_percentage, cost_price, margin_percentage, stock_quantity)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(product_code) DO UPDATE SET
                product_name = excluded.product_name,
                unit = excluded.unit,
                list_price = excluded.list_price,
                discount_percentage = excluded.discount_percentage,
                cost_price = excluded.cost_price,
                margin_percentage = excluded.margin_percentage,
                stock_quantity = excluded.stock_quantity
            `,
            args: [code, name, unit, listPrice, discountPercentage, costPrice, marginPercentage, stockQuantity],
          }
        })

        await db.batch(statements, 'write')

        return res.status(200).json({
          success: true,
          message: `Successfully processed ${items.length} items`,
          count: items.length,
        })
      }

      let productCode = String(body.productCode ?? '').trim()
      const productName = String(body.productName ?? '').trim()
      const unit = String(body.unit ?? 'Pcs.').trim()
      const listPrice = Number(body.listPrice || 0)
      const discountPercentage = Number(body.discountPercentage || 0)
      let costPrice = Number(body.costPrice || 0)
      const marginPercentage = Number(body.marginPercentage ?? body.margin_percentage ?? 15)
      const stockQuantity = Number(body.stockQuantity || 100)

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

      return res.status(201).json({
        success: true,
        product: fetchRes.rows[0],
      })
    } catch (error) {
      console.error('Add product error:', error)
      return res.status(500).json({ success: false, message: 'Failed to add product', error: String(error) })
    }
  }

  if (method === 'PUT') {
    try {
      const id = Number(req.query.id || req.body?.id)
      const body = req.body || {}
      const productCode = String(body.productCode ?? '').trim()
      const productName = String(body.productName ?? '').trim()
      const unit = String(body.unit ?? 'Pcs.').trim()
      const listPrice = Number(body.listPrice || 0)
      const discountPercentage = Number(body.discountPercentage || 0)
      let costPrice = Number(body.costPrice || 0)
      const marginPercentage = Number(body.marginPercentage ?? body.margin_percentage ?? 15)
      const stockQuantity = Number(body.stockQuantity || 0)

      if (costPrice <= 0 && listPrice > 0) {
        costPrice = Number((listPrice * (1 - discountPercentage / 100)).toFixed(2))
      }

      if (!id) {
        return res.status(400).json({ success: false, message: 'Invalid product ID' })
      }

      await db.execute({
        sql: `
          UPDATE products
          SET product_code = ?, product_name = ?, unit = ?, list_price = ?, discount_percentage = ?, cost_price = ?, margin_percentage = ?, stock_quantity = ?
          WHERE id = ?
        `,
        args: [productCode, productName, unit, listPrice, discountPercentage, costPrice, marginPercentage, stockQuantity, id],
      })

      return res.status(200).json({ success: true, message: 'Product updated successfully' })
    } catch (error) {
      console.error('Update product error:', error)
      return res.status(500).json({ success: false, message: 'Failed to update product', error: String(error) })
    }
  }

  if (method === 'DELETE') {
    try {
      const id = Number(req.query.id || req.body?.id)
      if (!id) {
        return res.status(400).json({ success: false, message: 'Invalid product ID' })
      }
      await db.execute({
        sql: `DELETE FROM products WHERE id = ?`,
        args: [id],
      })
      return res.status(200).json({ success: true, message: 'Product deleted successfully' })
    } catch (error) {
      console.error('Delete product error:', error)
      return res.status(500).json({ success: false, message: 'Failed to delete product', error: String(error) })
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' })
}
