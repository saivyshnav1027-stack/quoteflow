import { createClient } from '@libsql/client/web'

const DEFAULT_TURSO_URL = 'libsql://quoteflow-db-saivyshnav1027-stack.aws-ap-south-1.turso.io'
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0NDg3MjQsImlkIjoiMDFhMGRmMGMtYmQwMS03OWQ1LTkyYTUtMjE2MDdhN2U1N2M5Iiwia2lkIjoiR2swVEt2LUphQmVGMkxaVHFSV3RDYUltOFE4YnIweHBFVFlDUzJzMXFaayIsInJpZCI6IjUzYTAyNmI5LWQxNmEtNDc2Yi1hYzg3LWFiOTVhMWY1YzNmNCJ9.B44Vmgfr2EWmCJu-h3xorAv7wePo5Sq97Rdhmr0FdYYYSiy2Wrur1kEEW-ALINqb-f_7QnhfOgOTxUNBSY8bBA'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || DEFAULT_TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN || DEFAULT_TURSO_TOKEN,
})

export default async function handler(req, res) {
  const method = req.method?.toUpperCase()

  if (method === 'GET') {
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
        JOIN customer_types ct ON c.customer_type_id = ct.id
        ORDER BY c.customer_name ASC
      `)
      return res.status(200).json(result.rows)
    } catch (error) {
      console.error('Fetch customers error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch customers' })
    }
  }

  if (method === 'POST') {
    try {
      const body = req.body || {}
      const customerName = String(body.customerName ?? '').trim()
      const phone = String(body.phone ?? '').trim()
      const customerTypeId = Number(body.customerTypeId) || 1

      if (!customerName || !phone) {
        return res.status(400).json({ success: false, message: 'Name and phone are required' })
      }

      const result = await db.execute({
        sql: `INSERT INTO customers (customer_name, phone, customer_type_id) VALUES (?, ?, ?)`,
        args: [customerName, phone, customerTypeId],
      })

      const newId = Number(result.lastInsertRowid)
      const fetchRes = await db.execute({
        sql: `
          SELECT c.id, c.customer_name, c.phone, c.customer_type_id, ct.type_name, ct.markup_percentage
          FROM customers c
          JOIN customer_types ct ON c.customer_type_id = ct.id
          WHERE c.id = ?
        `,
        args: [newId],
      })

      return res.status(201).json({
        success: true,
        customer: fetchRes.rows[0],
      })
    } catch (error) {
      console.error('Create customer error:', error)
      return res.status(500).json({ success: false, message: 'Failed to create customer' })
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' })
}
