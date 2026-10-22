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

  if (method === 'POST' || method === 'DELETE') {
    try {
      const confirmation = req.body?.confirmation || req.headers['x-purge-confirmation']
      if (confirmation !== 'PURGE_ALL_DATA') {
        return res.status(400).json({
          success: false,
          message: 'Security token mismatch. Confirmation "PURGE_ALL_DATA" required.',
        })
      }

      // Purge transactional and master data
      await db.execute('DELETE FROM quotation_items')
      await db.execute('DELETE FROM quotations')
      await db.execute('DELETE FROM hero_product_children')
      await db.execute('DELETE FROM products')
      await db.execute('DELETE FROM customers')

      try {
        await db.execute(`
          DELETE FROM sqlite_sequence 
          WHERE name IN ('quotation_items', 'quotations', 'hero_product_children', 'products', 'customers')
        `)
      } catch {
        // Safe fallback if sqlite_sequence is unpopulated
      }

      return res.status(200).json({
        success: true,
        message: 'All products, customers, quotations, and hero bundles wiped successfully. System ready for production initialization.',
      })
    } catch (error) {
      console.error('Clean-slate purge error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to purge database',
        error: String(error),
      })
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' })
}
