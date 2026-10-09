# Project Handoff: Sri Venkateshwara Trading & Co - Quote Estimator & Inventory POS

**Date:** September 28, 2026  
**Repository:** [https://github.com/saivyshnav1027-stack/quoteflow.git](https://github.com/saivyshnav1027-stack/quoteflow.git)  
**Production URL:** [https://srivenkateshwaratraders-nine.vercel.app](https://srivenkateshwaratraders-nine.vercel.app)  
**Database:** Turso Cloud SQLite (`aws-ap-south-1.turso.io`)

---

## 1. Executive Summary

This application is a specialized Point-of-Sale (POS) Quote Estimator, Customer Management, and Inventory System created for **Sri Venkateshwara Trading & Co**, a wholesale and retail trading enterprise dealing in agricultural and domestic plumbing supplies (CPVC pipes, SWR fittings, PVC pipes, necko clamps, FRP chambers, and plastic tubing).

The system replaces manual paper slips with a high-speed digital counter tool that:

- Eliminates pricing calculation errors (list prices, discount percentages, and customer-type profit markups).
- Generates pixel-accurate reproductions of physical estimate slips.
- Sends instant quotations to customer WhatsApp numbers free of charge (no Meta API/Twilio costs).
- Persists all customer records, catalog products, and quotation histories in a cloud database.

---

## 2. System Architecture & Tech Stack

```mermaid
graph TD
    Client[Browser / Mobile / Counter PC]
    VercelEdge[Vercel Serverless Functions /api/*.js]
    LocalExpress[Local Express Backend server/src/index.ts:3000]
    TursoDB[(Turso Cloud SQLite)]
    LocalDB[(local.db SQLite Fallback)]

    Client -->|Prod /api/*| VercelEdge
    Client -->|Dev Proxy /api/*| LocalExpress
    VercelEdge -->|@libsql/client/web| TursoDB
    LocalExpress -->|Turso or local.db| TursoDB
    LocalExpress -.->|Offline Fallback| LocalDB
```

### Frontend

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 + Lucide React icons
- **State Management:** React Hooks (`useState`, `useEffect`, `useMemo`) with optimistic local storage caching
- **Pre-seeded Data:** `INITIAL_PRODUCTS` (26 real slip items), `INITIAL_CUSTOMERS`, and `INITIAL_CUSTOMER_TYPES` hardcoded into `src/App.tsx` state so catalog items and tiers render instantaneously even during cold starts or offline periods.

### Backend (Production - Vercel Serverless)

- Pure ECMAScript Modules (`/api/*.js`) running on Vercel Node/Edge runtime
- Uses `@libsql/client/web` (Fetch-based driver compatible with Vercel serverless environments)
- Endpoints:
  - `GET /api/test-db`: Health check and database connectivity probe.
  - `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`: Product catalog CRUD.
  - `GET /api/customers`, `POST /api/customers`: Customer party directory.
  - `GET /api/customer-types`, `PUT /api/customer-types/:id`: Pricing tier profit margin management.
  - `GET /api/quotations`, `POST /api/quotations`, `GET /api/quotations/:id`: Quotation history and itemized bills.

### Backend (Local Development)

- Node.js + Express + TypeScript (`server/src/index.ts`) running on port `3000`.
- Proxied automatically through Vite dev server (`http://localhost:5173/api` $\rightarrow$ `http://localhost:3000/api`).

---

## 3. Database Schema (Turso Cloud SQLite)

### Tables

1. **`customer_types`**
   - `id INTEGER PRIMARY KEY`
   - `type_name TEXT NOT NULL`
   - `markup_percentage REAL DEFAULT 0`
   - Default 5 Tiers:
     - Tier 1: Type A (Retail Regular) $\rightarrow$ 0% Markup
     - Tier 2: Type B (Preferred Contractor) $\rightarrow$ 5% Markup
     - Tier 3: Type C (Wholesale Farmer) $\rightarrow$ 10% Markup
     - Tier 4: Type D (Bulk Distributor) $\rightarrow$ 15% Markup
     - Tier 5: Type E (Special Commercial) $\rightarrow$ 20% Markup

2. **`customers`**
   - `id INTEGER PRIMARY KEY AUTOINCREMENT`
   - `customer_name TEXT NOT NULL`
   - `phone TEXT`
   - `customer_type_id INTEGER REFERENCES customer_types(id)`
   - `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`

3. **`products`**
   - `id INTEGER PRIMARY KEY AUTOINCREMENT`
   - `product_code TEXT UNIQUE`
   - `product_name TEXT NOT NULL`
   - `unit TEXT DEFAULT 'Pcs.'` (`Pcs.` or `Kgs.`)
   - `list_price REAL NOT NULL`
   - `discount_percentage REAL DEFAULT 0`
   - `cost_price REAL NOT NULL`
   - `stock_quantity REAL DEFAULT 100`

4. **`quotations`**
   - `id INTEGER PRIMARY KEY AUTOINCREMENT`
   - `quotation_number TEXT UNIQUE` (e.g. `EST-2354`)
   - `customer_id INTEGER REFERENCES customers(id)`
   - `customer_type_id INTEGER REFERENCES customer_types(id)`
   - `subtotal REAL NOT NULL`
   - `total_units REAL NOT NULL`
   - `total REAL NOT NULL`
   - `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`

5. **`quotation_items`**
   - `id INTEGER PRIMARY KEY AUTOINCREMENT`
   - `quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE`
   - `product_id INTEGER REFERENCES products(id)`
   - `description TEXT NOT NULL`
   - `quantity REAL NOT NULL`
   - `unit TEXT DEFAULT 'Pcs.'`
   - `list_price REAL NOT NULL`
   - `discount_percentage REAL NOT NULL`
   - `price REAL NOT NULL` (Net computed unit price)
   - `line_total REAL NOT NULL`

---

## 4. Key Workflows & Features Implemented

### 4.1. Pricing & Mathematics Engine

For every item added to an estimate, the net selling price and line total are computed as:
$$\text{Discounted List Price} = \text{List Price} \times \left(1 - \frac{\text{Discount \%}}{100}\right)$$
$$\text{Net Unit Price} = \text{Discounted List Price} \times \left(1 + \frac{\text{Tier Markup \%}}{100}\right)$$
$$\text{Line Total} = \text{Net Unit Price} \times \text{Quantity}$$

### 4.2. Sequential Estimate Numbering

- Uses sequential estimate numbering starting at `#2354` (matching physical paper bill books).
- Persisted in browser `localStorage` (`sri_current_estimate_no`).
- Automatically increments (`#2354` $\rightarrow$ `#2355`...) when an estimate is saved or cleared for the next customer.

### 4.3. Free WhatsApp Sharing (`https://wa.me/`)

- Sanitizes the customer's phone number (`phone.replace(/[^0-9]/g, '')`).
- If no phone number is provided (e.g. walk-in guest), opens the WhatsApp Contact/Chat picker.
- Formats a receipt with emojis, bold headers, itemized quantities, units, and INR totals.
- On Mobile: Deep-links to the native WhatsApp / WhatsApp Business app.
- On Counter PC: Opens WhatsApp Web (`web.whatsapp.com`) with the pre-drafted message.
- Shows a post-share action banner: *"Estimate Shared via WhatsApp! Ready for next customer?"* with a 1-click **[Clear & Start Next Estimate]** button.

### 4.4. 1-Click Clear & Reset

- Dedicated **[Clear Estimate]** button in the bottom action bar with safety confirmation dialog.
- Top **[+ New Estimate]** button in the header.
- Resets row items, search query, dropdowns, and bumps the sequential bill number.

### 4.5. Adjust Margin Functionality (Fixed & Verified)

- Located under **Customer Types & Margins** page $\rightarrow$ **Adjust Margin**.
- Fixed parameter mismatch between frontend and Vercel serverless function (`markup` vs `markupPercentage`).
- Optimistic updates in React state so profit margin updates instantly without screen flickers.
- Recalculates any active estimate rows immediately if the currently selected customer belongs to the modified tier.

---

## 5. File Map & Project Structure

```text
d:\TEST_Vyshnav\
├── api/                            # Vercel Serverless Functions (Pure ESM)
│   ├── customer-types.js           # GET all tiers, PUT update tier margin
│   ├── customers.js                # GET all customers with tier join, POST new customer
│   ├── products.js                 # GET all products, POST new product, PUT edit product
│   ├── quotations.js               # GET all quotations, POST new quotation, GET single quotation
│   ├── test-db.js                  # Connectivity probe for Turso DB
│   └── test.js                     # Smoke test endpoint
│
├── server/                         # Local Express Backend
│   ├── src/
│   │   ├── db.ts                   # Turso client with fallback to local SQLite
│   │   ├── schema.ts               # DDL table creation and 26-item initial seed
│   │   └── index.ts                # Express server routes on port 3000
│   └── tsconfig.json
│
├── src/                            # Frontend Application (React + Vite)
│   ├── App.tsx                     # Main monolithic component (all views, modals & logic)
│   ├── main.tsx                    # React DOM entrypoint
│   └── index.css                   # Global styles and Tailwind CSS imports
│
├── public/                         # Static assets and favicon
├── vercel.json                     # Vercel routing and URL rewrite rules
├── vite.config.ts                  # Vite config with backend proxy (/api -> localhost:3000)
├── package.json                    # Dependencies and npm scripts
├── tsconfig.json                   # TypeScript project references
└── HANDOFF.md                      # This handoff document
```

---

## 6. How to Run Locally

### Prerequisites

- Node.js 18+ installed.

### Steps

1. **Clone & Install Dependencies:**

   ```bash
   git clone https://github.com/saivyshnav1027-stack/quoteflow.git
   cd quoteflow
   npm install
   ```

2. **Environment Variables (`.env`):**
   Ensure `.env` in the root contains:

   ```env
   PORT=3000
   TURSO_DATABASE_URL=libsql://quoteflow-db-saivyshnav1027-stack.aws-ap-south-1.turso.io
   TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0NDg3MjQsImlkIjoiMDFhMGRmMGMtYmQwMS03OWQ1LTkyYTUtMjE2MDdhN2U1N2M5Iiwia2lkIjoiR2swVEt2LUphQmVGMkxaVHFSV3RDYUltOFE4YnIweHBFVFlDUzJzMXFaayIsInJpZCI6IjUzYTAyNmI5LWQxNmEtNDc2Yi1hYzg3LWFiOTVhMWY1YzNmNCJ9.B44Vmgfr2EWmCJu-h3xorAv7wePo5Sq97Rdhmr0FdYYYSiy2Wrur1kEEW-ALINqb-f_7QnhfOgOTxUNBSY8bBA
   ```

3. **Start the Local Backend Server:**

   ```bash
   npx tsx server/src/index.ts
   # Runs on http://localhost:3000
   ```

4. **Start the Vite Frontend (in a separate terminal):**

   ```bash
   npm run dev
   # Runs on http://localhost:5173
   ```

5. **Build for Production Validation:**

   ```bash
   npm run build
   # Runs tsc -b && vite build
   ```

---

## 7. Known Issues & Backlog for Future Work

The following items are recommended for the next phase of development:

### 1. Authentication Security

- **Current State:** Single shopkeeper portal using a client-side login screen (Demo password: `admin123`).
- **Improvement:** Implement JWT tokens or HTTP-only session cookies on `/api` serverless functions to restrict API access exclusively to authenticated users.

### 2. Inventory Stock Deduction on Estimate Finalization

- **Current State:** Saving a quotation records the sale in `quotations` and `quotation_items`, but does not decrement `stock_quantity` in the `products` table.
- **Improvement:** In `api/quotations.js` (and `server/src/index.ts`), wrap quotation creation in a transaction that updates `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`.

### 3. Quotation Deletion and Status Management

- **Current State:** Quotations can be viewed and printed, but cannot be marked as "Completed", "Cancelled", or deleted from the UI.
- **Improvement:** Add a `status` column (`Draft`, `Confirmed`, `Delivered`, `Cancelled`) and a delete/void button with confirmation.

### 4. Direct PDF Download

- **Current State:** Print button triggers `window.print()` using print-specific CSS.
- **Improvement:** Add `jspdf` or `html2pdf.js` to allow 1-click downloading of `.pdf` receipts directly on mobile phones that may not have printer drivers installed.

### 5. Multi-User / Cashier Roles

- **Current State:** Single shared store session.
- **Improvement:** Add Cashier / Owner roles with permissions (e.g. only Owner can adjust tier margins or view wholesale cost prices).
