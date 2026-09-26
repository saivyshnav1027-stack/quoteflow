import { db, isUsingTurso } from './db.js'

export async function initSchema() {
  console.log(`[Database] Initializing schema (${isUsingTurso ? 'Turso Cloud' : 'Local SQLite'})...`)

  // 1. Customer Types Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS customer_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_name TEXT NOT NULL UNIQUE,
      markup_percentage REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 2. Customers Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      customer_type_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_type_id) REFERENCES customer_types(id)
    )
  `)

  // 3. Products Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_code TEXT NOT NULL UNIQUE,
      product_name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'Pcs.',
      list_price REAL NOT NULL DEFAULT 0.0,
      discount_percentage REAL NOT NULL DEFAULT 0.0,
      cost_price REAL NOT NULL DEFAULT 0.0,
      stock_quantity REAL NOT NULL DEFAULT 0.0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 4. Quotations Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      customer_type_id INTEGER,
      markup_percentage REAL NOT NULL DEFAULT 0.0,
      subtotal REAL NOT NULL DEFAULT 0.0,
      total_units REAL NOT NULL DEFAULT 0.0,
      total REAL NOT NULL DEFAULT 0.0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (customer_type_id) REFERENCES customer_types(id)
    )
  `)

  // 5. Quotation Items Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      product_id INTEGER,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1.0,
      unit TEXT NOT NULL DEFAULT 'Pcs.',
      list_price REAL NOT NULL DEFAULT 0.0,
      discount_percentage REAL NOT NULL DEFAULT 0.0,
      price REAL NOT NULL DEFAULT 0.0,
      line_total REAL NOT NULL DEFAULT 0.0,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `)

  console.log('[Database] Schema initialization complete.')
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('schema.ts')) {
  initSchema()
    .then(() => {
      console.log('Schema ready.')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Schema initialization failed:', err)
      process.exit(1)
    })
}
