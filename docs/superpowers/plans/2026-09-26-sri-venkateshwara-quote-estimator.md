# Sri Venkateshwara Trading & Co - Quote Estimator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a streamlined, high-speed Quote Estimator and inventory management system for rural trading business "Sri Venkateshwara Trading & Co", featuring walk-in customer management, product catalog with units (Pcs/Kgs), list price discount calculations, 100% free WhatsApp sharing (`wa.me`), printable estimate slip matching physical paper invoice format, Turso/local SQLite dual database support, and Vercel deployment readiness.

**Architecture:** 
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS v4 Single Page Application with fixed sidebar navigation (Estimator, Products, Customers, Dashboard, Customer Types).
- Backend: Express 5 + TypeScript (`tsx`) REST API handling inventory CRUD, customer tiers, and quotation snapshotting.
- Persistence: LibSQL `@libsql/client` with dual mode: connects to Turso Cloud (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`) for Vercel, and falls back to local SQLite (`file:local.db`) for offline shop operations.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Express 5, LibSQL (`@libsql/client`), Turso, Dotenv, CORS.

---

## Global Constraints

- Currency: Indian Rupees (₹) formatted with comma separators (`en-IN`).
- Decimal Quantities: Quantities must support decimals (e.g. `52.28 Kgs.`, `40.00 Kgs.`, `10.00 Pcs.`).
- Pricing Formula: Price = List Price * (1 - Dis% / 100), Line Total = Qty * Price.
- Dual DB support: Never crash if `TURSO_DATABASE_URL` is missing; fallback automatically to `file:local.db`.
- Printable Slip: Match the exact layout from the physical paper estimation slip (Party Details, Invoice No, Dated, Chek [✓], Totals c/o).

---

### Task 1: Database Dual Mode & Real-World Seed Data

**Files:**
- Modify: `server/src/db.ts`
- Create: `server/src/schema.ts`
- Create: `server/src/seed.ts`

**Interfaces:**
- Consumes: `@libsql/client`, `dotenv/config`
- Produces: `db` client, tables (`customer_types`, `customers`, `products`, `quotations`, `quotation_items`), 26 seeded products and customer `Kondalu`.

- [ ] **Step 1: Configure Dual Database Client in `server/src/db.ts`**
  - Read `process.env.TURSO_DATABASE_URL`. If present and valid, connect with `authToken: process.env.TURSO_AUTH_TOKEN`.
  - If unset or empty, connect with `url: 'file:local.db'`.
- [ ] **Step 2: Create Unified Schema Migration `server/src/schema.ts`**
  - Define `customer_types` (id, type_name, markup_percentage, created_at)
  - Define `customers` (id, customer_name, phone, customer_type_id, created_at)
  - Define `products` (id, product_code, product_name, unit, list_price, discount_percentage, cost_price, stock_quantity, created_at)
  - Define `quotations` (id, quotation_number, customer_id, customer_type_id, markup_percentage, subtotal, total_units, total, created_at)
  - Define `quotation_items` (id, quotation_id, product_id, description, quantity, unit, list_price, discount_percentage, price, line_total)
- [ ] **Step 3: Create Seed Script `server/src/seed.ts` with Real Data**
  - Seed 5 customer types (Type A to E)
  - Seed customer `Kondalu` (+91 98480 12345)
  - Seed the 26 real items from the receipt:
    1. LD 3*20 (Kgs., List: 64, Dis: 0%)
    2. Yellow Tubing Nandi Flex (Kgs., List: 130, Dis: 0%)
    3. LD 3*15 (Kgs., List: 64, Dis: 0%)
    4. LD 4*15 (Kgs., List: 64, Dis: 0%)
    5. LD 4*20 (Kgs., List: 64, Dis: 0%)
    6. 9" Waste Coupling (Pcs., List: 120, Dis: 0%)
    7. 6" Waste Coupling (Pcs., List: 95, Dis: 0%)
    8. 75mm Necko Clamps (Pcs., List: 29, Dis: 0%)
    9. 110MM NECKOCLAMPS (Pcs., List: 31, Dis: 0%)
    10. Nandi 63MM Pvc Elbow (H) (Pcs., List: 41.60, Dis: 28%)
    11. Nandi 63MM Pvc Tee (H) (Pcs., List: 51.23, Dis: 28%)
    12. Ashirwad 3/4" CPVC PIPE SDR 13.5 (Pcs., List: 462, Dis: 54%)
    13. Ashirwad 1" CPVC PIPE SDR 13.5 (Pcs., List: 663, Dis: 54%)
    14. Ashirwad Cpvc 1"' Pipe SDR11 (Pcs., List: 771, Dis: 54%)
    15. WC Harpan (Pcs., List: 340, Dis: 0%)
    16. 18*22 Steel Sink (Pcs., List: 950, Dis: 0%)
    17. 12*12 Beed Chamber (Pcs., List: 280, Dis: 0%)
    18. 24*24 FRP Chamber (Pcs., List: 1250, Dis: 0%)
    19. Ashirwad SWR 75mm Plain Bend (Pcs., List: 101, Dis: 48%)
    20. Ashirwad SWR 75MM Nani Trap (Pcs., List: 144, Dis: 48%)
    21. Ashirwad 75MM SWR Pipe (Pcs., List: 542, Dis: 48%)
    22. Ashirwad 110MM SWR Pipe (Pcs., List: 942, Dis: 48%)
    23. Nandi 75MM Swr Pipe (Pcs., List: 195, Dis: 0%)
    24. Nandi 110MM Swr Pipe (Pcs., List: 340, Dis: 0%)
    25. 110MM PVC Pipe Nandi (Pcs., List: 900, Dis: 0%)
    26. 90MM PVC Pipe Nandi (Pcs., List: 630, Dis: 0%)
- [ ] **Step 4: Execute Schema & Seed Script**
  - Run `npx tsx server/src/seed.ts` and verify all tables and 26 items exist in database.

---

### Task 2: Backend API Endpoints Update

**Files:**
- Modify: `server/src/index.ts`

**Interfaces:**
- Endpoints:
  - `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
  - `GET /api/customers`, `POST /api/customers`, `PUT /api/customers/:id`
  - `GET /api/customer-types`, `PUT /api/customer-types/:id`
  - `GET /api/quotations`, `POST /api/quotations`
  - `GET /api/test-db`

- [ ] **Step 1: Update Product CRUD Endpoints**
  - Support `unit`, `list_price`, `discount_percentage`, `cost_price`, `stock_quantity`.
  - Add DELETE endpoint to remove unused products.
- [ ] **Step 2: Update Quotation Calculation & Save Endpoint**
  - Validate and accept items with `productId`, `description`, `quantity` (float), `unit`, `listPrice`, `discountPercentage`, `price`, `lineTotal`.
  - Calculate `total_units` (sum of quantities) and `total` amount.
  - Insert master quotation and line items.
- [ ] **Step 3: Test API Endpoints with Node Script**
  - Run verification script checking `GET /api/products` and `POST /api/quotations`.

---

### Task 3: Frontend Architecture & Sidebar Layout

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Fixed Dark Navy Sidebar (`#0F172A`)
- Pages: `Estimator` (active default), `Products`, `Customers`, `Dashboard`, `Customer Types`.
- Shop title: "Sri Venkateshwara Trading & Co"

- [ ] **Step 1: Implement Fixed Left Sidebar & Shell Header**
  - Implement navigation sidebar matching Stitch design with icons and active pills.
  - Add top bar with shop badge and quick status.
- [ ] **Step 2: Connect Page Switcher State**
  - Add state for `activePage` switching between the 5 views.

---

### Task 4: Interactive Quote Estimator Workspace

**Files:**
- Modify: `src/App.tsx`

**Features:**
- Customer lookup dropdown + "+ New Customer" inline modal + "Guest Walk-In" 1-click button.
- Product search combobox with autocomplete + "+ Add New Product to Inventory" inline modal.
- Tabular items list with:
  `S.N. | Description of Goods | Qty (decimal input) | Unit | List Price | Dis% | Net Price | Amount(₹) | Action`
- Running summary: Total Items, Total Units (`X Units`), Subtotal, Applied Tier/Markup, Final Estimated Budget (`₹Y`).
- "Save Quote" action saving to backend `/api/quotations`.

- [ ] **Step 1: Implement Customer Search & Quick Add Component**
- [ ] **Step 2: Implement Product Search & Dynamic Row Table**
- [ ] **Step 3: Implement Live Pricing & Unit Recalculation Engine**
- [ ] **Step 4: Implement Save Estimate Backend Integration**

---

### Task 5: 100% Free WhatsApp Sharing & Printable Paper Slip

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css` (print styles)

**Features:**
- WhatsApp Share (`wa.me`) generating pre-formatted quotation message.
- Printable modal and `@media print` stylesheet matching the physical paper slip.

- [ ] **Step 1: Build WhatsApp `wa.me` URL Generator**
  - Format customer name, date, invoice number, itemized list, total units, and final amount in rupees.
- [ ] **Step 2: Build Printable "ESTIMATION" Slip Component**
  - Render exact replica of physical receipt:
    - Header: `ESTIMATION` / `Original Copy`
    - `Party Details : [Customer Name]` | `Invoice No. : [Number]` | `Dated : [Date (Time)]`
    - Grid: `S.N.`, `Description of Goods`, `Chek [✓]`, `Qty.`, `Unit`, `List`, `Dis%`, `Price`, `Amount(₹)`
    - Footer: `Totals c/o : [Total Units]` | `[Total Amount]`
  - Add `@media print` rules so clicking "Print Estimate" triggers a clean browser print without sidebar/UI elements.

---

### Task 6: Products, Customers, Customer Types & Dashboard Pages

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Build Products Catalog Page**
  - Searchable table, filter by Unit (Pcs/Kgs), Add/Edit product modal.
- [ ] **Step 2: Build Customers Directory Page**
  - Customer list with Phone, Tier badge, Add/Edit customer modal.
- [ ] **Step 3: Build Customer Types Tier Page**
  - Tier list (Type A to E) with configurable profit/discount percentages.
- [ ] **Step 4: Build Operations Dashboard Page**
  - Metric cards: Total Estimates, Active SKUs, Catalog Valuation, Recent Quotes audit table.

---

### Task 7: Vercel Configuration & Git Commit

**Files:**
- Create: `vercel.json`
- Modify: `package.json`

- [ ] **Step 1: Add Vercel Serverless & Build Configuration**
- [ ] **Step 2: Verify Build (`npm run build`)**
- [ ] **Step 3: Git Commit Changes**
