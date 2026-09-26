import 'dotenv/config'
import { createClient } from '@libsql/client'

const tursoUrl = process.env.TURSO_DATABASE_URL?.trim()
const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim()

const isTurso = Boolean(tursoUrl && (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://')))

export const db = createClient(
  isTurso
    ? {
        url: tursoUrl!,
        authToken: tursoToken,
      }
    : {
        url: 'file:local.db',
      }
)

export const isUsingTurso = isTurso