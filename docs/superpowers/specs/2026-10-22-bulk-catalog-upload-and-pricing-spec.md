# Bulk Product Catalog Upload, Net Pricing Engine & Production Clean-Slate Spec

**Date:** 2026-10-22  
**Status:** In Review / Specification  
**Author:** Pair Programming Session with Sri Venkateshwara Traders  

---

## 1. Executive Summary & Real-World Context

QuoteFlow is transitioning from development/mock testing to live production handoff for **Sri Venkateshwara Trading & Co** (Jammikunta, Telangana). 

In hardware and plumbing wholesale trading:
1. **Initial Store Onboarding (Clean Slate):** Before opening counter operations, the business owner will wipe all test data and seed the entire store catalog (100 to 500+ items) from vendor spreadsheets (Finolex, Astral, Ashirvad, Crompton). The bulk upload tool is the **primary onboarding vehicle** for the entire business.
2. **Network Latency & Batch Chunking:** In production on Vercel with Turso Cloud SQLite (`aws-ap-south-1.turso.io`), saving individual rows sequentially incurs a 2-second roundtrip per item. Uploading 300 rows row-by-row would take 10 minutes. By chunking into **batches of 100 items**, each batch executes in a single atomic SQL transaction (~400–800ms total per batch), coupled with an **ETA countdown screen**.
3. **Messy Supplier Inputs & Unit Normalization:** Supplier Excel sheets frequently contain informal or misspelled unit names (`pcs`, `PCS`, `nos`, `pieces`, `MTR`, `meter`, `roll`). The system must automatically normalize these into canonical trading units without throwing validation errors.
4. **Counter Net Price Visibility:** Counter staff need to see the exact **Net Selling Price (₹)** on the Products Catalog and in Add/Edit modals with live bidirectional sync to answer customer inquiries instantaneously.

---

## 2. System Architecture & Component Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                PRODUCTS & CATALOG SUBSYSTEM                             │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         ▼                                  ▼                                  ▼
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│  BULK UPLOAD     │               │  CATALOG & MODALS│               │ PRODUCTION RESET │
│  INGESTION TOOL  │               │  NET PRICE SYNC  │               │ (CLEAN SLATE)    │
└────────┬─────────┘               └────────┬─────────┘               └────────┬─────────┘
         │                                  │                                  │
 ┌───────┴───────────────┐          ┌───────┴───────────────┐          ┌───────┴───────────────┐
 │ 1. Excel/CSV Parser   │          │ 1. ProductsCatalog.tsx│          │ 1. AdminSettingsView  │
 │    (xlsx / SheetJS)   │          │    - Net Price column │          │    Clean Slate card   │
 │ 2. Unit Normalizer    │          │ 2. AddProductModal    │          │ 2. Confirmation Modal │
 │    (pcs, nos, mtr...) │          │    - Net Price input  │          │    (Type CONFIRM)     │
 │ 3. Calculation Engine │          │ 3. EditProductModal   │          │ 3. Atomic purge API   │
 │    Mode A & Mode B    │          │    - Net Price input  │          │    (Products, Quotes, │
 │ 4. Smart SKU Matcher  │          │ 4. Pure pricing sync  │          │     Customers, Heroes)│
 │ 5. 100-Item Chunking  │          │    (pricing.ts)       │          └───────────────────────┘
 │ 6. ETA Progress Modal │          └───────────────────────┘
 │ 7. Success Summary    │
 └───────────────────────┘
```

---

## 3. Subsystem Specifications

### 3.1. Subsystem A: Bulk Upload Ingestion & Review Tool (`BulkUploadModal.tsx`)

#### 1. File Upload & Ingestion
* Supports `.xlsx`, `.xls`, and `.csv`.
* Client-side parsing using `xlsx` (SheetJS): fast, offline-capable, and avoids serverless payload limits.
* Smart header mapping: matches variants such as `Product Code` / `SKU` / `Item Code`; `Product Name` / `Description` / `Item Name`; `List Price` / `MRP` / `List Rate`; `Trade Discount` / `Trade Dis %` / `Discount`; `Cost Price` / `Cost` / `Purchase Rate`; `Margin` / `Margin %`; `Net Price` / `Selling Price` / `Net Rate`.

#### 2. Unit Normalization Engine
Automatically cleans misspelled or casing-variant units:
* `['pcs', 'pcs.', 'pc', 'piece', 'pieces', 'nos', 'nos.', 'no', 'number', 'numbers', 'units']` $\rightarrow$ `'Pcs.'`
* `['kg', 'kgs', 'kgs.', 'kilo', 'kilogram', 'kilograms']` $\rightarrow$ `'Kgs.'`
* `['mtr', 'mtr.', 'meter', 'meters', 'metre', 'metres', 'm']` $\rightarrow$ `'Mtr.'`
* `['roll', 'rolls', 'rl']` $\rightarrow$ `'Rolls'`
* `['set', 'sets', 'st']` $\rightarrow$ `'Sets'`
* `['ft', 'feet', 'foot']` $\rightarrow$ `'Ft.'`
* Any unparseable string $\rightarrow$ Fallback cleanly to `'Pcs.'`

#### 3. Calculation Superiority Engine (Two-Way Paired Modes)
The upload modal features a prominent toggle for the business owner:
* **Mode A: [Cost Price + Net Price] are Superior (Cash Amount Driven - Default):**
  - **Ground Truth:** `Cost Price (₹)` and `Net Price (₹)`.
  - If `List Price` is present:
    $$\text{Trade Discount } \% = \frac{\text{List Price} - \text{Cost Price}}{\text{List Price}} \times 100$$
  - Margin is dynamically derived:
    $$\text{Margin } \% = \frac{\text{Net Price} - \text{Cost Price}}{\text{Cost Price}} \times 100$$
* **Mode B: [Trade Discount % + Margin %] are Superior (Percentage Driven):**
  - **Ground Truth:** `Trade Discount %` and `Margin %`.
  - Derives purchase cost and selling price from List Price:
    $$\text{Cost Price} = \text{List Price} \times (1 - \text{Trade Discount } \% \div 100)$$
    $$\text{Net Price} = \text{Cost Price} \times (1 + \text{Margin } \% \div 100)$$

#### 4. Smart SKU Matching & Auto-Generation
* **Existing SKU Match:** If the row provides a `Product Code` matching an existing catalog item in the store $\rightarrow$ flags row as `[UPDATE PRICE]` (will revise prices without duplicating the SKU).
* **Missing SKU Auto-Generation:** If `Product Code` is blank or omitted $\rightarrow$ auto-generates a clean sequential SKU: `SKU-XXXX` (e.g. `SKU-1001`, `SKU-1002`) and flags row as `[NEW PRODUCT]`.

#### 5. 100-Row Batch Chunking & Live ETA Modal (`BulkUploadProgressModal.tsx`)
* Splits parsed catalog records into chunks of 100 items: `[Batch 1 (1–100), Batch 2 (101–200), ...]`.
* Sequentially dispatches `POST /api/products/bulk` for each batch.
* **Live Progress UI:**
  - Progress bar percentage: e.g. `60% (180 / 300 products uploaded)`.
  - Active status: `Processing Batch 2 of 3...`.
  - Dynamic ETA countdown: measures elapsed batch time and calculates remaining seconds:
    $$\text{ETA Seconds} = (\text{Remaining Batches}) \times (\text{Average Batch Time in Seconds})$$
* **Success Completion Modal:**
  - Displays summary: Total items imported, total prices updated, and execution duration.

---

### 3.2. Subsystem B: Net Price Integration across Catalog & Modals

1. **Products Catalog Table ([`ProductsCatalog.tsx`](file:///d:/TEST_Vyshnav/src/components/Products/ProductsCatalog.tsx)):**
   - Add dedicated **Net Price (₹)** column right alongside Cost and Margin.
   - Shows formatted selling rate in bold emerald text (e.g. `₹92.00`).
2. **Add Product Modal ([`AddProductModal.tsx`](file:///d:/TEST_Vyshnav/src/components/Products/AddProductModal.tsx)):**
   - Add interactive **Net Price (₹)** input field.
   - Full 2-way synchronization with Margin %:
     - Typing **Net Price** updates **Margin %**.
     - Typing **Margin %** updates **Net Price**.
     - Changing **List Price** or **Trade Discount %** updates both **Cost** and **Net Price**.
3. **Edit Product Modal ([`EditProductModal.tsx`](file:///d:/TEST_Vyshnav/src/components/Products/EditProductModal.tsx)):**
   - Incorporates the identical Net Price input and 2-way synchronization.

---

### 3.3. Subsystem C: Template Download & Export

* **Button 1: Download Blank Catalog Template (`.xlsx`):**
  - Generates a cleanly styled Excel workbook with official SVT branding.
  - Columns: `Product Code`, `Product Name`, `Unit`, `List Price`, `Trade Discount %`, `Cost Price`, `Margin %`, `Net Price`.
  - Pre-filled with 2 sample demonstration rows (e.g. CPVC Pipe, Brass Valve) and instructional comments in headers.
* **Button 2: Export Current Catalog (`.xlsx`):**
  - Exports all existing products from the database into an editable Excel spreadsheet so the shopkeeper can modify prices in Excel and re-upload.

---

### 3.4. Subsystem D: Production Clean-Slate (Factory Reset for Handoff)

In [`AdminSettingsView.tsx`](file:///d:/TEST_Vyshnav/src/components/Settings/AdminSettingsView.tsx):
* **"Production Handoff Clean-Slate" Danger Zone Card**:
  - Allows the developer/admin to purge all mock and test records before handing off the system.
  - Wipes:
    1. `products` (and cascades to `hero_product_children`)
    2. `quotations` (and cascades to `quotation_items`)
    3. `customers`
* **High-Safety Confirmation Modal:**
  - Requires user to explicitly type `"PURGE PRODUCTION DATA"` into an input field before the action button is unlocked.
  - Calls `DELETE /api/admin/clean-slate`.

---

## 4. API Endpoints Specification

### 4.1. `POST /api/products/bulk`
* **Payload:**
  ```json
  {
    "products": [
      {
        "productCode": "CPVC-075",
        "productName": "Ashirwad 3/4 CPVC Pipe",
        "unit": "Pcs.",
        "listPrice": 450,
        "discountPercentage": 10,
        "costPrice": 405,
        "marginPercentage": 15,
        "stockQuantity": 100
      }
    ]
  }
  ```
* **Execution:**
  - Wraps operations in a batch transaction.
  - Checks if `product_code` exists:
    - If exists $\rightarrow$ `UPDATE products SET list_price = ?, discount_percentage = ?, cost_price = ?, margin_percentage = ?, product_name = ?, unit = ? WHERE product_code = ?`.
    - If not exists $\rightarrow$ `INSERT INTO products (product_code, product_name, unit, list_price, discount_percentage, cost_price, margin_percentage, stock_quantity, is_hero) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`.
* **Response (HTTP 200):**
  ```json
  {
    "success": true,
    "insertedCount": 85,
    "updatedCount": 15,
    "totalProcessed": 100
  }
  ```

### 4.2. `DELETE /api/admin/clean-slate`
* **Headers:** `{ "x-admin-action": "CONFIRM_PURGE" }`
* **Execution:**
  - Deletes in order of foreign key constraints:
    `DELETE FROM hero_product_children;`
    `DELETE FROM quotation_items;`
    `DELETE FROM quotations;`
    `DELETE FROM products;`
    `DELETE FROM customers;`
* **Response (HTTP 200):**
  ```json
  { "success": true, "message": "All store data purged successfully for production handoff." }
  ```

---

## 5. Verification & Testing Plan

1. **Unit Tests (Vitest):**
   - Unit normalization tests (verify all 20+ spelling variations parse cleanly).
   - Mode A calculation tests (Cost + Net Price superior $\rightarrow$ back-calculate discount & margin).
   - Mode B calculation tests (Discount + Margin superior $\rightarrow$ derive cost & net price).
   - Batch chunker tests (verify arrays of 350 items split cleanly into 100, 100, 100, 50).
2. **Build & Type Checking:**
   - Run `npm test -- --run` to ensure all 44 existing tests + new tests pass.
   - Run `npm run build` to verify zero TypeScript errors.
3. **End-to-End Operational Verification:**
   - Test uploading a 250-row Excel file with messy units and verify 3 batches process with live ETA.
   - Verify Net Price appears in Products Catalog table and Add/Edit modals.
