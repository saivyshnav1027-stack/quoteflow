# Retailer Estimates Dynamic Pricing & Floating Navigation Implementation Plan

> **Goal:** Introduce Party-Wise Rate History for Retailers, smart purge filtering, a dedicated Estimates management page, a modern high-level Dashboard, and a collapsible/floating sidebar for 100% full-screen counter speed.

---

## 1. Scope & Architecture

### Backend / Database
- **Schema Migration (`server/src/schema.ts`, `api/customers.js`):**
  - Add `is_retailer INTEGER NOT NULL DEFAULT 0` to `customers` table.
- **Rate History API (`server/src/index.ts`, `api/customers.js` or `api/customer-rates.js`):**
  - Endpoint `GET /api/customers/:id/rate-history`:
    Returns `{ [productId]: { lastPrice, lastCostPrice, quotationNumber, createdAt } }` derived from the most recent `quotation_items` for that `customer_id`.
- **Quotations API (`server/src/index.ts`, `api/quotations.js`):**
  - Query joins `customers.is_retailer`.
  - `DELETE /api/quotations?timeline=...&preserveRetailers=true`:
    If `preserveRetailers=true`, only purges estimates where `customer_id IS NULL` OR `customers.is_retailer = 0`.
  - Individual `DELETE /api/quotations/:id` remains unconstrained for the owner.

### Frontend
- **Types (`src/types/index.ts`):**
  - Update `Customer` with `is_retailer?: boolean | number`.
  - Update `Quotation` with `is_retailer?: boolean | number`.
  - Update `ActivePage` to `'Dashboard' | 'Estimates' | 'Estimator' | 'Products' | 'HeroProducts' | 'Customers' | 'Settings'`.
- **Floating / Collapsible Sidebar (`src/components/Layout/Sidebar.tsx` & `src/App.tsx`):**
  - Collapsible state with hamburger `☰` toggle in the header and hover-zone on the left edge.
  - Floating drawer overlay that leaves 100% width for the main content area.
- **Dedicated Estimates Page (`src/components/Estimates/EstimatesView.tsx`):**
  - Houses the full quotations table, live search, view slip, edit, delete, and smart purge dropdown with `Preserve Retailer Estimates` checkbox.
- **Redesigned Dashboard (`src/components/Dashboard/DashboardView.tsx`):**
  - Clean morning overview: Today's Estimates Count, Today's Quoted Volume (₹), Top Retailers, Pending Quotes, Quick Action buttons.
- **Customer Retailer Badge & Toggle (`src/components/Customers/NewCustomerModal.tsx`, `CustomerListView.tsx`):**
  - Add `Retailer (Reseller)` toggle switch in Add Customer modal.
  - Show purple/blue `Retailer` badge in customer list and dropdowns.
- **Estimator Dynamic Rate Resolution (`src/components/Estimator/EstimatorView.tsx` & `src/App.tsx`):**
  - When a `Retailer` customer is selected, fetch their rate history map.
  - When products are added, auto-populate the row with `lastQuotedPrice` if found.
  - Display badge: `⚡ Last Quoted: ₹XX (Est #YY on DD-MMM)` with a 1-click toggle to `[ Reset to Catalog: ₹ZZ ]`.
  - Display loss-prevention alert if `currentCostPrice > lastQuotedPrice`.

---

## 2. Step-by-Step Task Breakdown

### Task 1: Database Migration & Rate History Endpoint
- Update `server/src/schema.ts` to ensure `is_retailer` exists on `customers`.
- Update `server/src/index.ts` and `api/customers.js` to support `is_retailer` in `GET /api/customers`, `POST /api/customers`.
- Add `GET /api/customers/:id/rate-history` in `server/src/index.ts` and `api/customer-rates.js`.
- Add unit tests for rate history retrieval and customer retailer flag.

### Task 2: Selective Purge in Quotations API
- Update `api/quotations.js` and `server/src/index.ts`:
  - When purging by timeline (`weekly`, `monthly`, `all`), check `req.query.preserve_retailers === 'true'`.
  - If true, exclude quotes where `customer_id IN (SELECT id FROM customers WHERE is_retailer = 1)`.

### Task 3: Collapsible Floating Sidebar
- Update `src/components/Layout/Sidebar.tsx` to support collapsed / floating overlay state.
- Add hamburger menu button and hover activation in `src/App.tsx`.

### Task 4: Dedicated Estimates Page & Clean Dashboard
- Create `src/components/Estimates/EstimatesView.tsx`.
- Update `src/components/Dashboard/DashboardView.tsx` with clean morning metrics and quick actions.
- Update `ActivePage` routing in `src/App.tsx`.

### Task 5: Customer Retailer Toggle & Estimator Dynamic Rate Memory
- Update `NewCustomerModal.tsx` and `CustomerListView.tsx` with `is_retailer`.
- Update `App.tsx` and `EstimatorView.tsx` to load customer rate history and apply it with visual badges and cost-hike alerts.

### Task 6: Verification, Production Build & UI Browser Testing
- Run `npm test -- --run`.
- Run `npm run build`.
- Launch dev server or preview, execute browser subagent test:
  1. Create a Retailer customer (e.g., `Shri Balaji Hardware - Village Reseller`).
  2. Create an initial estimate with custom negotiated price (e.g., ₹42 instead of catalog ₹46).
  3. Start a new estimate for the same Retailer, add that product, and verify the rate memory badge, price prefill, and toggle in the UI.
  4. Capture screenshots for user review.
