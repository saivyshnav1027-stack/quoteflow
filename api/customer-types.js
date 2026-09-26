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
        SELECT id, type_name, markup_percentage
        FROM customer_types
        ORDER BY id
      `)
      return res.status(200).json(result.rows)
    } catch (error) {
      console.error('Fetch customer types error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch customer types', error: String(error) })
    }
  }

  if (method === 'PUT') {
    try {
      const id = Number(req.query.id || req.body?.id)
      const markupPercentage = Number(req.body?.markupPercentage ?? 0)

      if (!id) {
        return res.status(400).json({ success: false, message: 'Invalid customer type ID' })
      }

      await db.execute({
        sql: `UPDATE customer_types SET markup_percentage = ? WHERE id = ?`,
        args: [markupPercentage, id],
      })

      return res.status(200).json({ success: true, message: 'Customer tier updated successfully' })
    } catch (error) {
      console.error('Update tier error:', error)
      return res.status(500).json({ success: false, message: 'Failed to update customer tier', error: String(error) })
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' })
}
