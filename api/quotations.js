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
  const id = req.query.id ? Number(req.query.id) : null
  const db = getDb()

  if (method === 'GET') {
    if (id) {
      try {
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

        return res.status(200).json({
          success: true,
          quotation: {
            ...quoteRes.rows[0],
            items: itemsRes.rows,
          },
        })
      } catch (error) {
        console.error('Fetch quotation error:', error)
        return res.status(500).json({ success: false, message: 'Failed to fetch quotation details', error: String(error) })
      }
    }

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
      return res.status(200).json(result.rows)
    } catch (error) {
      console.error('Fetch quotations error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch quotation history', error: String(error) })
    }
  }

  if (method === 'POST') {
    try {
      const body = req.body || {}
      const customerId = body.customerId ? Number(body.customerId) : null
      const customerName = String(body.customerName || 'Guest Walk-In')
      const customerPhone = String(body.customerPhone || '')
      const customerTypeId = body.customerTypeId ? Number(body.customerTypeId) : 1
      const markupPercentage = Number(body.markupPercentage || 0)
      const items = body.items || []

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

      const countRes = await db.execute('SELECT COUNT(*) as count FROM quotations')
      const nextCount = Number(countRes.rows[0].count) + 1
      const quotationNumber = body.quotationNumber ? String(body.quotationNumber) : `EST-${2353 + nextCount}`

      const quoteResult = await db.execute({
        sql: `
          INSERT INTO quotations 
          (quotation_number, customer_id, customer_type_id, markup_percentage, subtotal, total_units, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [quotationNumber, customerId, customerTypeId, markupPercentage, total, totalUnits, total],
      })

      const quotationId = Number(quoteResult.lastInsertRowid)

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

      return res.status(201).json({
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
          createdAt: new Date().toISOString(),
          items: processedItems,
        },
      })
    } catch (error) {
      console.error('Create quotation error:', error)
      return res.status(500).json({ success: false, message: 'Failed to create quotation', error: String(error) })
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' })
}
