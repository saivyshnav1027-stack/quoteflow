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
          COALESCE(c.is_retailer, 0) AS is_retailer,
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
      const existingNumbers = new Set()
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

      let quotationNumber = body.quotationNumber ? String(body.quotationNumber).trim() : ''
      if (!quotationNumber || existingNumbers.has(quotationNumber)) {
        quotationNumber = `${datePrefix}A${maxSeq + 1}`
      }

      let validCustomerId = null
      if (customerId) {
        const custCheck = await db.execute({
          sql: 'SELECT id FROM customers WHERE id = ?',
          args: [customerId],
        })
        if (custCheck.rows.length > 0) {
          validCustomerId = customerId
        }
      }

      let validCustomerTypeId = null
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
        let validProductId = null
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

  if (method === 'PUT') {
    try {
      const targetId = id || (req.body?.id ? Number(req.body.id) : null)
      if (!targetId || Number.isNaN(targetId)) {
        return res.status(400).json({ success: false, message: 'Quotation ID is required for update' })
      }

      const quoteCheck = await db.execute({
        sql: 'SELECT id, quotation_number FROM quotations WHERE id = ?',
        args: [targetId],
      })

      if (quoteCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Quotation not found' })
      }

      const existingQuotationNumber = String(quoteCheck.rows[0].quotation_number)

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

      let validCustomerId = null
      if (customerId) {
        const custCheck = await db.execute({
          sql: 'SELECT id FROM customers WHERE id = ?',
          args: [customerId],
        })
        if (custCheck.rows.length > 0) {
          validCustomerId = customerId
        }
      }

      let validCustomerTypeId = null
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
        args: [validCustomerId, validCustomerTypeId, markupPercentage, total, totalUnits, total, targetId],
      })

      await db.execute({
        sql: `DELETE FROM quotation_items WHERE quotation_id = ?`,
        args: [targetId],
      })

      for (const item of processedItems) {
        let validProductId = null
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
            targetId,
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

      return res.status(200).json({
        success: true,
        message: 'Quotation updated successfully',
        quotation: {
          id: targetId,
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
      return res.status(500).json({ success: false, message: 'Failed to update quotation', error: String(error) })
    }
  }

  if (method === 'DELETE') {
    try {
      // 1. Single quotation deletion by id
      const singleId = req.query.id ? Number(req.query.id) : null
      if (singleId) {
        await db.execute({
          sql: `DELETE FROM quotation_items WHERE quotation_id = ?`,
          args: [singleId],
        })
        await db.execute({
          sql: `DELETE FROM quotations WHERE id = ?`,
          args: [singleId],
        })
        return res.status(200).json({ success: true, message: 'Quotation deleted successfully' })
      }

      // 2. Timeline-based batch deletion
      const timeline = String(req.query.timeline || req.body?.timeline || '').toLowerCase()
      const olderThanDays = req.query.olderThanDays ? Number(req.query.olderThanDays) : null
      const preserveRetailers = req.query.preserve_retailers === 'true' || req.query.preserveRetailers === 'true' || req.body?.preserveRetailers === true

      let matchingSql = `SELECT id FROM quotations`
      let args = []
      let conditions = []

      if (timeline === 'weekly' || olderThanDays === 7) {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        conditions.push(`(created_at < ? OR datetime(created_at) < datetime('now', '-7 days'))`)
        args.push(cutoff)
      } else if (timeline === 'monthly' || olderThanDays === 30) {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        conditions.push(`(created_at < ? OR datetime(created_at) < datetime('now', '-30 days'))`)
        args.push(cutoff)
      } else if (timeline === 'all') {
        // Purge all records
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid request. Provide id or timeline=weekly, monthly, or all',
        })
      }

      if (preserveRetailers) {
        conditions.push(`(customer_id IS NULL OR customer_id NOT IN (SELECT id FROM customers WHERE is_retailer = 1))`)
      }

      if (conditions.length > 0) {
        matchingSql += ` WHERE ` + conditions.join(' AND ')
      }

      const matches = await db.execute({
        sql: matchingSql,
        args,
      })

      const ids = matches.rows.map((r) => Number(r.id)).filter((id) => Number.isInteger(id))

      if (ids.length === 0) {
        return res.status(200).json({
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

      return res.status(200).json({
        success: true,
        deletedCount: ids.length,
        message: `Successfully deleted ${ids.length} estimate(s)`,
      })
    } catch (error) {
      console.error('Delete quotation error:', error)
      return res.status(500).json({ success: false, message: 'Failed to delete quotation(s)', error: String(error) })
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' })
}
