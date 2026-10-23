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
  if (method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const customerId = Number(req.query.customerId || req.query.id)
  if (!customerId || !Number.isInteger(customerId)) {
    return res.status(400).json({ success: false, message: 'Invalid customer ID' })
  }

  const db = getDb()

  try {
    const result = await db.execute({
      sql: `
        SELECT
          qi.product_id,
          qi.description,
          qi.price AS last_price,
          qi.cost_price AS last_cost_price,
          qi.margin_percentage AS last_margin_percentage,
          qi.discount AS last_discount,
          qi.discount_type AS last_discount_type,
          qi.list_price AS last_list_price,
          qi.discount_percentage AS last_discount_percentage,
          q.quotation_number,
          q.created_at
        FROM quotation_items qi
        JOIN quotations q ON q.id = qi.quotation_id
        WHERE q.customer_id = ?
        ORDER BY q.created_at DESC, q.id DESC, qi.id DESC
      `,
      args: [customerId],
    })

    const historyMap = {}
    for (const row of result.rows) {
      const pid = Number(row.product_id)
      if (pid && !historyMap[pid]) {
        historyMap[pid] = {
          productId: pid,
          productName: String(row.description || ''),
          lastPrice: Number(row.last_price || 0),
          lastCostPrice: Number(row.last_cost_price || 0),
          lastMarginPercentage: Number(row.last_margin_percentage || 0),
          lastDiscount: Number(row.last_discount || 0),
          lastDiscountType: String(row.last_discount_type || 'PERCENT'),
          lastListPrice: Number(row.last_list_price || 0),
          lastDiscountPercentage: Number(row.last_discount_percentage || 0),
          quotationNumber: String(row.quotation_number || ''),
          createdAt: String(row.created_at || ''),
        }
      }
    }

    return res.status(200).json({
      success: true,
      customerId,
      rates: historyMap,
    })
  } catch (error) {
    console.error('Fetch customer rate history error:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch customer rate history', error: String(error) })
  }
}
