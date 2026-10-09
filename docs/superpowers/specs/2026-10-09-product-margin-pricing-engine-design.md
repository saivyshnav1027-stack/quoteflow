# Design Specification: Product Margin Pricing Engine & Customer Type Removal

**Date:** 2026-10-09  
**Status:** Approved by User  
**Target:** QuoteFlow POS / Sri Venkateshwara Trading & Co.

---

## 1. Overview & Objectives

Transform QuoteFlow from a customer-tier-based pricing model to a **Product-Level Margin + Customer Discount** pricing engine, matching physical wholesale counter slip workflows:
1. **Retire Customer Types:** Remove customer tiers (Type A to Type E), tier markups, and customer tier management navigation.
2. **Product Margin Model:** Products carry base acquisition cost (`cost_price`) and default profit margin (`margin_percentage`, e.g. 15%).
3. **Admin Feature Flags:**
   - **Feature Flag 1 (`enableListPriceDiscount`):** Toggle between Simple Cost-Only Mode (default) and Manufacturer List Price + Trade Discount Mode.
   - **Feature Flag 2 (`enableFlatRupeeDiscount`):** Allow switching between percentage discount (`DIS %`) and round-off flat Rupee discount (`DIS ₹`) on estimate rows.
4. **Estimator Pricing Engine:**
   - Calculate Price After Margin: $\text{Cost Price} \times (1 + \frac{\text{Margin \%}}{100})$.
   - Calculate Net Unit Price with exact 2 decimal places: $\text{Price After Margin} \times (1 - \frac{\text{DIS \%}}{100})$ (or minus flat ₹).
   - Calculate Line Amount: $\text{QTY} \times \text{Net Unit Price}$.

---

## 2. Mathematical Model & Calculations

For each item row $i$:
1. **Base Cost:** $\text{costPrice}_i$
   - If `enableListPriceDiscount` is ON: $\text{costPrice}_i = \text{listPrice}_i \times (1 - \frac{\text{tradeDis}_i}{100})$
   - If `enableListPriceDiscount` is OFF: Entered directly as $\text{costPrice}_i$.
2. **Price After Margin:**
   $$\text{priceAfterMargin}_i = \text{costPrice}_i \times \left(1 + \frac{\text{marginPercentage}_i}{100}\right)$$
3. **Net Price (Per Piece / Unit):**
   - If Discount Type is `%`:
     $$\text{netPrice}_i = \text{round}_2\left(\text{priceAfterMargin}_i \times \left(1 - \frac{\text{discount}_i}{100}\right)\right)$$
   - If Discount Type is `₹`:
     $$\text{netPrice}_i = \text{round}_2\left(\max(0, \text{priceAfterMargin}_i - \text{discount}_i)\right)$$
4. **Line Total:**
   $$\text{lineTotal}_i = \text{round}_2(\text{quantity}_i \times \text{netPrice}_i)$$
5. **Estimate Subtotal & Total:**
   $$\text{total} = \sum_{i} \text{lineTotal}_i$$

All currency amounts and unit prices maintain exact 2 decimal places (`round_2` / `toFixed(2)`).

---

## 3. Component Architecture & Data Models

### 3.1 Database Schema & Migration Strategy

#### `products` Table
Add or ensure column:
- `margin_percentage REAL NOT NULL DEFAULT 15.0`
- `cost_price REAL NOT NULL DEFAULT 0.0`
- `list_price REAL DEFAULT 0.0`
- `discount_percentage REAL DEFAULT 0.0`

#### `quotation_items` Table
Ensure columns:
- `cost_price REAL NOT NULL DEFAULT 0.0`
- `margin_percentage REAL NOT NULL DEFAULT 0.0`
- `discount REAL NOT NULL DEFAULT 0.0`
- `discount_type TEXT NOT NULL DEFAULT 'PERCENT'` (`PERCENT` or `FLAT`)
- `price REAL NOT NULL DEFAULT 0.0` (Net unit selling price)
- `line_total REAL NOT NULL DEFAULT 0.0`

#### `customers` Table
- `customer_name TEXT NOT NULL`
- `phone TEXT`
- Deprecate / make `customer_type_id` nullable or default `1` to avoid breaking backward foreign key compatibility.

---

### 3.2 Frontend UI & Navigation ([src/App.tsx](file:///d:/TEST_Vyshnav/src/App.tsx))

1. **Sidebar Navigation:**
   - Remove `Customer Types` tab.
   - Retain: `Dashboard`, `Estimator (POS)`, `Products`, `Customers`.
   - Add a clean `Settings` modal or gear button for feature toggles.
2. **Admin Feature Flags State (stored in `localStorage`):**
   - `enableListPriceMode`: Boolean (default `false`). When `true`, displays List Price & Trade Dis% in Product catalog and Estimator.
   - `enableFlatRupeeDiscount`: Boolean (default `true`). Allows selecting `%` or `₹` for the discount on estimate rows.
3. **Estimator Row Columns:**
   - S.N.
   - Description of Goods
   - Chek (☐)
   - Qty
   - Unit
   - *(Optional if Flag 1 ON)* List Price
   - *(Optional if Flag 1 ON)* Trade Dis %
   - Cost Price
   - Margin % (with helper displaying Price After Margin)
   - Dis (% or ₹)
   - Net Price (Per Unit)
   - Amount (₹)
   - Actions (Delete)
4. **Customer Picker in Estimator:**
   - Shows Customer Name and Phone only (no tier or markup badge).

---

### 3.3 Backend API Updates

1. **[api/products.js](file:///d:/TEST_Vyshnav/api/products.js) & [server/src/index.ts](file:///d:/TEST_Vyshnav/server/src/index.ts):**
   - Accept and return `margin_percentage` on `GET`, `POST`, and `PUT`.
2. **[api/quotations.js](file:///d:/TEST_Vyshnav/api/quotations.js) & [server/src/index.ts](file:///d:/TEST_Vyshnav/server/src/index.ts):**
   - Accept items with `costPrice`, `marginPercentage`, `discount`, `discountType`, `price` (net unit price), `lineTotal`.
   - Store exact line attributes into `quotation_items`.
   - Remove customer tier markup multiplier logic.
3. **[api/customers.js](file:///d:/TEST_Vyshnav/api/customers.js):**
   - Simplify customer query and insertion without requiring customer type.

---

## 4. Verification & Testing Criteria

1. **Calculation Accuracy:**
   - Example 1: Qty 2, Cost 2100, Margin 15%, Dis 5% -> Price after margin = 2415.00, Net Price = 2294.25, Amount = 4588.50.
   - Example 2 (Flat ₹): Qty 2, Cost 2100, Margin 15% (2415), Flat Dis ₹120 -> Net Price = 2295.00, Amount = 4590.00.
2. **Feature Flags:**
   - Toggling List Price mode dynamically shows/hides manufacturer columns in both Product modals and Estimator table.
3. **Build & Tests:**
   - `npm run build` succeeds with exit code 0.
