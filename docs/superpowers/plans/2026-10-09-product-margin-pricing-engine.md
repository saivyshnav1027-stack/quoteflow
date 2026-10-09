# Product Margin Pricing Engine & Customer Type Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform QuoteFlow from customer-tier markups to a per-product margin pricing engine with customer discount, feature flags, and remove customer types.

**Architecture:** Update the LibSQL schema and endpoints (`api/products.js`, `api/quotations.js`, `server/src/index.ts`) to persist `margin_percentage` on products and estimate line items. Refactor the frontend React app (`src/App.tsx`) to remove customer types, add admin feature flags, and update the Estimator table with real-time margin and discount calculations matching the reference spreadsheet with exact 2 decimal places.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Node.js / Express 5, LibSQL / Turso Cloud SQLite.

**Spec:** [docs/superpowers/specs/2026-10-09-product-margin-pricing-engine-design.md](file:///d:/TEST_Vyshnav/docs/superpowers/specs/2026-10-09-product-margin-pricing-engine-design.md)

## Global Constraints
- Exact 2 decimal places for all monetary calculations (`round_2` / `toFixed(2)`).
- No hardcoded customer tiers (Type A-E).
- Preserves backward compatibility of past quotes.

---

### Task 1: Backend APIs & Schema Updates for Margin and Line Items

**Files:**
- Modify: `api/products.js`
- Modify: `api/quotations.js`
- Modify: `server/src/index.ts`
- Modify: `server/src/schema.ts`

**Interfaces:**
- Produces: `margin_percentage` on `Product` (default 15.0), `margin_percentage`, `discount`, `discount_type`, `cost_price` on `QuotationItem`.

- [ ] **Step 1: Update `api/products.js` and `server/src/index.ts` products CRUD**
  - Support `margin_percentage` column in `SELECT`, `INSERT`, and `UPDATE`.
  - Fallback: `margin_percentage` defaults to 15.0 if not provided.
- [ ] **Step 2: Update `api/quotations.js` and `server/src/index.ts` quotations CRUD**
  - Store item `cost_price`, `margin_percentage`, `discount`, `discount_type` on `quotation_items`.
  - Accept and store items directly without multiplying by customer tier markup.
- [ ] **Step 3: Test backend endpoints locally**
  - Run node test script to ensure product insertion and quotation creation succeed without errors.
- [ ] **Step 4: Commit Task 1**
  ```bash
  git add api/ server/
  git commit -m "feat(api): support product margin and detailed quotation line item fields"
  ```

---

### Task 2: Frontend Types, Navigation & Admin Feature Flags

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `enableListPriceMode` and `enableFlatRupeeDiscount` settings in React state + `localStorage`.
- Removes: `Customer Types` page from navigation.

- [ ] **Step 1: Update TypeScript types in `src/App.tsx`**
  - Add `margin_percentage: number` to `Product`.
  - Add `marginPercentage: number`, `discount: number`, `discountType: 'PERCENT' | 'FLAT'`, `costPrice: number` to `EstimateRow`.
  - Update `activePage` type to remove `'Customer Types'`.
- [ ] **Step 2: Add Settings Modal and remove Customer Types tab**
  - Remove `Customer Types` button from sidebar navigation.
  - Add a **Settings** button in the sidebar and header.
  - Implement a clean modal with:
    - Toggle 1: "Show Manufacturer List Price & Trade Discount" (`enableListPriceMode`, default `false`).
    - Toggle 2: "Allow Flat Rupee (₹) Discount on Estimates" (`enableFlatRupeeDiscount`, default `true`).
  - Persist both in `localStorage`.
- [ ] **Step 3: Remove Customer Types page view**
  - Remove `{activePage === 'Customer Types' && ...}` and tier edit modal.
- [ ] **Step 4: Commit Task 2**
  ```bash
  git add src/App.tsx
  git commit -m "feat(ui): remove customer types navigation and add admin feature flags modal"
  ```

---

### Task 3: Product Master Catalog Updates (Add/Edit Product & Default Margin)

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `enableListPriceMode` feature flag.
- Produces: Products created/edited with `cost_price` and `margin_percentage`.

- [ ] **Step 1: Update Add Product Modal**
  - If `enableListPriceMode` is OFF: show only **Cost Price (₹)** and **Default Margin (%)** (defaults to 15%).
  - If `enableListPriceMode` is ON: show **List Price (₹)**, **Trade Dis (%)**, and auto-calculate **Cost Price (₹)**.
- [ ] **Step 2: Update Edit Product Modal**
  - Display and allow editing of `margin_percentage` alongside `cost_price`.
- [ ] **Step 3: Update Inventory Table**
  - Display `Margin %` column in the product table.
- [ ] **Step 4: Commit Task 3**
  ```bash
  git add src/App.tsx
  git commit -m "feat(products): add margin percentage and feature-flagged manufacturer pricing"
  ```

---

### Task 4: Estimator POS Pricing Engine & Table Update

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Spreadsheet pricing formula: $\text{Price After Margin} = \text{Cost} \times (1 + \text{Margin}\%)$, $\text{Net Price} = \text{Price After Margin} - \text{DIS}$, $\text{Amount} = \text{QTY} \times \text{Net Price}$.

- [ ] **Step 1: Implement `calculateRow` mathematical function**
  - Price After Margin: `Number((costPrice * (1 + marginPct / 100)).toFixed(2))`
  - Net Price:
    - If `discountType === 'PERCENT'`: `Number((priceAfterMargin * (1 - discount / 100)).toFixed(2))`
    - If `discountType === 'FLAT'`: `Number(Math.max(0, priceAfterMargin - discount).toFixed(2))`
  - Line Total: `Number((netPrice * quantity).toFixed(2))`
- [ ] **Step 2: Update Estimator Table Columns**
  - S.N., Description, Chek (☐), Qty, Unit.
  - (If Flag 1 ON: List Price, Dis %).
  - Cost Price (editable).
  - Margin % (editable, with small sub-label showing Price After Margin).
  - DIS (editable, with `%` / `₹` selector if Flag 2 is enabled).
  - Net Price (read-only per-piece calculated price).
  - Amount (₹).
  - Action (Delete).
- [ ] **Step 3: Update Customer Picker in Estimator**
  - Display customer name and phone without tier markup badge.
- [ ] **Step 4: Commit Task 4**
  ```bash
  git add src/App.tsx
  git commit -m "feat(estimator): implement spreadsheet-matching margin and customer discount pricing engine"
  ```

---

### Task 5: Verification, Build & Production Deployment

**Files:**
- Test & Verify: entire repository.

- [ ] **Step 1: Test pricing formula with sample cases**
  - Case 1: Qty 2, Unit KGS, Cost 2100, Margin 15%, Dis 5% -> Price After Margin = 2415.00, Net Price = 2294.25, Amount = 4588.50.
  - Case 2: Qty 2, Unit KGS, Cost 2100, Margin 15%, Flat Dis ₹120 -> Net Price = 2295.00, Amount = 4590.00.
- [ ] **Step 2: Run production build**
  ```bash
  npm run build
  ```
  Ensure 0 errors and successful output bundle.
- [ ] **Step 3: Push to PROD (`origin main`)**
  ```bash
  git push origin main
  ```
- [ ] **Step 4: Verify live PROD deployment at `https://srivenkateshwaratraders-nine.vercel.app`**
