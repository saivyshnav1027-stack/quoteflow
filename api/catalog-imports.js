import { createClient } from '@libsql/client/web'

const DEFAULT_TURSO_URL = 'libsql://quoteflow-db-saivyshnav1027-stack.aws-ap-south-1.turso.io'
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0NDg3MjQsImlkIjoiMDFhMGRmMGMtYmQwMS03OWQ1LTkyYTUtMjE2MDdhN2U1N2M5Iiwia2lkIjoiR2swVEt2LUphQmVGMkxaVHFSV3RDYUltOFE4YnIweHBFVFlDUzJzMXFaayIsInJpZCI6IjUzYTAyNmI5LWQxNmEtNDc2Yi1hYzg3LWFiOTVhMWY1YzNmNCJ9.B44Vmgfr2EWmCJu-h3xorAv7wePo5Sq97Rdhmr0FdYYYSiy2Wrur1kEEW-ALINqb-f_7QnhfOgOTxUNBSY8bBA'

function getDb() {
  return createClient({
    url: DEFAULT_TURSO_URL,
    authToken: DEFAULT_TURSO_TOKEN,
  })
}

async function ensureTable(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS catalog_imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      file_size_kb REAL NOT NULL DEFAULT 0.0,
      total_rows INTEGER NOT NULL DEFAULT 0,
      new_count INTEGER NOT NULL DEFAULT 0,
      update_count INTEGER NOT NULL DEFAULT 0,
      pricing_mode TEXT NOT NULL DEFAULT 'MODE_A',
      snapshot_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export default async function handler(req, res) {
  const method = req.method?.toUpperCase()
  const db = getDb()

  try {
    await ensureTable(db)

    if (method === 'GET') {
      const result = await db.execute(`
        SELECT id, filename, file_size_kb, total_rows, new_count, update_count, pricing_mode, snapshot_json, created_at
        FROM catalog_imports
        ORDER BY id DESC
        LIMIT 50
      `)
      return res.status(200).json(result.rows)
    }

    if (method === 'POST') {
      const body = req.body || {}
      const filename = String(body.filename || 'import.csv').trim()
      const fileSizeKb = Number(body.fileSizeKb || 0)
      const totalRows = Number(body.totalRows || 0)
      const newCount = Number(body.newCount || 0)
      const updateCount = Number(body.updateCount || 0)
      const pricingMode = String(body.pricingMode || 'MODE_A')
      const snapshotJson = body.snapshotJson ? (typeof body.snapshotJson === 'string' ? body.snapshotJson : JSON.stringify(body.snapshotJson)) : ''

      const insertRes = await db.execute({
        sql: `
          INSERT INTO catalog_imports (filename, file_size_kb, total_rows, new_count, update_count, pricing_mode, snapshot_json)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [filename, fileSizeKb, totalRows, newCount, updateCount, pricingMode, snapshotJson],
      })

      return res.status(201).json({
        success: true,
        id: Number(insertRes.lastInsertRowid),
        message: 'Import record logged successfully',
      })
    }

    if (method === 'DELETE') {
      await db.execute('DELETE FROM catalog_imports')
      return res.status(200).json({ success: true, message: 'Import history cleared' })
    }

    return res.status(405).json({ message: 'Method Not Allowed' })
  } catch (error) {
    console.error('Catalog imports error:', error)
    return res.status(500).json({ success: false, message: 'Database error', error: String(error) })
  }
}
