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
        SELECT id, product_code, product_name, unit, list_price, discount_percentage, cost_price, stock_quantity
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
      let productCode = String(body.productCode ?? '').trim()
      const productName = String(body.productName ?? '').trim()
      const unit = String(body.unit ?? 'Pcs.').trim()
      const listPrice = Number(body.listPrice || 0)
      const discountPercentage = Number(body.discountPercentage || 0)
      let costPrice = Number(body.costPrice || 0)
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
      const costPrice = Number(body.costPrice || 0)
      const stockQuantity = Number(body.stockQuantity || 0)

      if (!id) {
        return res.status(400).json({ success: false, message: 'Invalid product ID' })
      }

      await db.execute({
        sql: `
          UPDATE products
          SET product_code = ?, product_name = ?, unit = ?, list_price = ?, discount_percentage = ?, cost_price = ?, stock_quantity = ?
          WHERE id = ?
        `,
        args: [productCode, productName, unit, listPrice, discountPercentage, costPrice, stockQuantity, id],
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
