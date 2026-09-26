import { createClient } from '@libsql/client/web'

export default async function handler(req, res) {
  try {
    const DEFAULT_TURSO_URL = 'libsql://quoteflow-db-saivyshnav1027-stack.aws-ap-south-1.turso.io'
    const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0NDg3MjQsImlkIjoiMDFhMGRmMGMtYmQwMS03OWQ1LTkyYTUtMjE2MDdhN2U1N2M5Iiwia2lkIjoiR2swVEt2LUphQmVGMkxaVHFSV3RDYUltOFE4YnIweHBFVFlDUzJzMXFaayIsInJpZCI6IjUzYTAyNmI5LWQxNmEtNDc2Yi1hYzg3LWFiOTVhMWY1YzNmNCJ9.B44Vmgfr2EWmCJu-h3xorAv7wePo5Sq97Rdhmr0FdYYYSiy2Wrur1kEEW-ALINqb-f_7QnhfOgOTxUNBSY8bBA'

    const db = createClient({
      url: DEFAULT_TURSO_URL,
      authToken: DEFAULT_TURSO_TOKEN,
    })

    const result = await db.execute('SELECT 1 AS connected')
    res.status(200).json({
      success: true,
      message: 'QuoteFlow connected to Turso Cloud DB successfully!',
      isUsingTurso: true,
      result: result.rows,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      isUsingTurso: false,
      error: String(error),
    })
  }
}
