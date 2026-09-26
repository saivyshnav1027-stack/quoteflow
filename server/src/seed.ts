import { db } from './db.js'
import { initSchema } from './schema.js'

async function seed() {
  await initSchema()

  console.log('[Seed] Seeding customer types...')
  const types = [
    ['Type A (Retail Regular)', 0],
    ['Type B (Preferred Contractor)', 5],
    ['Type C (Wholesale Farmer)', 10],
    ['Type D (Bulk Distributor)', 15],
    ['Type E (Special Commercial)', 20],
  ]

  for (const [typeName, markup] of types) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO customer_types (type_name, markup_percentage) VALUES (?, ?)`,
      args: [typeName, markup],
    })
  }

  console.log('[Seed] Seeding sample customers...')
  const customers = [
    ['Kondalu', '+91 98480 12345', 1],
    ['Ramesh Patel', '+91 98765 43210', 2],
    ['Srinivas Rao (Agri Works)', '+91 94401 56789', 3],
  ]

  for (const [name, phone, typeId] of customers) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO customers (customer_name, phone, customer_type_id) VALUES (?, ?, ?)`,
      args: [name, phone, typeId],
    })
  }

  console.log('[Seed] Seeding 26 real products from Sri Venkateshwara Trading invoice...')
  const products = [
    { code: 'LD-320', name: 'LD 3*20 (28 de)', unit: 'Kgs.', list: 64.0, dis: 0.0, cost: 58.0 },
    { code: 'NANDI-YEL', name: 'Yellow Tubing Nandi Flex', unit: 'Kgs.', list: 130.0, dis: 0.0, cost: 115.0 },
    { code: 'LD-315', name: 'LD 3*15 (5b de)', unit: 'Kgs.', list: 64.0, dis: 0.0, cost: 58.0 },
    { code: 'LD-415', name: 'LD 4*15 (5b u)', unit: 'Kgs.', list: 64.0, dis: 0.0, cost: 58.0 },
    { code: 'LD-420', name: 'LD 4*20 (6b de)', unit: 'Kgs.', list: 64.0, dis: 0.0, cost: 58.0 },
    { code: 'WC-09', name: '9" Waste Coupling', unit: 'Pcs.', list: 120.0, dis: 0.0, cost: 95.0 },
    { code: 'WC-06', name: '6" Waste Coupling', unit: 'Pcs.', list: 95.0, dis: 0.0, cost: 75.0 },
    { code: 'NC-75', name: '75mm Necko Clamps', unit: 'Pcs.', list: 29.0, dis: 0.0, cost: 22.0 },
    { code: 'NC-110', name: '110MM NECKOCLAMPS', unit: 'Pcs.', list: 31.0, dis: 0.0, cost: 24.0 },
    { code: 'NPVC-ELB-63', name: 'Nandi 63MM Pvc Elbow (H)', unit: 'Pcs.', list: 41.6, dis: 28.0, cost: 25.0 },
    { code: 'NPVC-TEE-63', name: 'Nandi 63MM Pvc Tee (H)', unit: 'Pcs.', list: 51.23, dis: 28.0, cost: 30.0 },
    { code: 'ASH-CPVC-075', name: 'Ashirwad 3/4" CPVC PIPE SDR 13.5', unit: 'Pcs.', list: 462.0, dis: 54.0, cost: 175.0 },
    { code: 'ASH-CPVC-100', name: 'Ashirwad 1" CPVC PIPE SDR 13.5', unit: 'Pcs.', list: 663.0, dis: 54.0, cost: 250.0 },
    { code: 'ASH-CPVC-1S11', name: 'Ashirwad Cpvc 1" Pipe SDR11', unit: 'Pcs.', list: 771.0, dis: 54.0, cost: 290.0 },
    { code: 'WC-HARP', name: 'WC Harpan', unit: 'Pcs.', list: 340.0, dis: 0.0, cost: 280.0 },
    { code: 'SINK-1822', name: '18*22 Steel Sink', unit: 'Pcs.', list: 950.0, dis: 0.0, cost: 780.0 },
    { code: 'CHAM-1212', name: '12*12 Beed Chamber', unit: 'Pcs.', list: 280.0, dis: 0.0, cost: 220.0 },
    { code: 'FRP-2424', name: '24*24 FRP Chamber', unit: 'Pcs.', list: 1250.0, dis: 0.0, cost: 980.0 },
    { code: 'ASH-SWR-B75', name: 'Ashirwad SWR 75mm Plain Bend', unit: 'Pcs.', list: 101.0, dis: 48.0, cost: 42.0 },
    { code: 'ASH-SWR-T75', name: 'Ashirwad SWR 75MM Nani Trap', unit: 'Pcs.', list: 144.0, dis: 48.0, cost: 60.0 },
    { code: 'ASH-SWR-P75', name: 'Ashirwad 75MM SWR Pipe', unit: 'Pcs.', list: 542.0, dis: 48.0, cost: 225.0 },
    { code: 'ASH-SWR-P110', name: 'Ashirwad 110MM SWR Pipe', unit: 'Pcs.', list: 942.0, dis: 48.0, cost: 390.0 },
    { code: 'NANDI-SWR-75', name: 'Nandi 75MM Swr Pipe', unit: 'Pcs.', list: 195.0, dis: 0.0, cost: 155.0 },
    { code: 'NANDI-SWR-110', name: 'Nandi 110MM Swr Pipe', unit: 'Pcs.', list: 340.0, dis: 0.0, cost: 275.0 },
    { code: 'NPVC-110', name: '110MM PVC Pipe Nandi', unit: 'Pcs.', list: 900.0, dis: 0.0, cost: 720.0 },
    { code: 'NPVC-90', name: '90MM PVC Pipe Nandi', unit: 'Pcs.', list: 630.0, dis: 0.0, cost: 505.0 },
  ]

  for (const p of products) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO products 
        (product_code, product_name, unit, list_price, discount_percentage, cost_price, stock_quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [p.code, p.name, p.unit, p.list, p.dis, p.cost, 100],
    })
  }

  console.log('[Seed] Database successfully seeded with 26 real items and customer profiles!')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
