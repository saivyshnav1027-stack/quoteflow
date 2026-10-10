# Modular Architecture Refactor & Pricing Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Combined with ponytail (lazy, zero-bloat, smallest complete changes, ripple checks). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the monolithic 2,400-line `App.tsx` into modular components and an isolated, pure pricing engine (`src/lib/pricing.ts`) with automated Vitest regression unit tests, reducing cognitive load and preventing business flow regressions.

**Architecture:** 
1. Extract domain types into `src/types/index.ts`.
2. Extract pure mathematical formulas into `src/lib/pricing.ts` with comprehensive unit tests (`src/lib/pricing.test.ts`).
3. Decompose monolithic views into modular components (`Sidebar`, `EstimatorView`, `ProductsView`, `CustomersView`, `DashboardView`, `PrintSlipModal`, `AdminSettingsView`).
4. Reassemble `src/App.tsx` as a lean root component (<150 lines).

**Tech Stack:** React 19, TypeScript, Vite, TailwindCSS v4, Vitest.

---

## Global Constraints
- Preserve exact existing UI layout, styles, and behavior.
- Preserve exact pricing formulas:
  - $\text{Price After Margin} = \text{Cost Price} \times (1 + \frac{\text{Margin \%}}{100})$
  - $\text{Net Price} = \text{Price After Margin} \times (1 - \frac{\text{DIS \%}}{100})$ (or flat ₹)
  - $\text{Amount} = \text{Qty} \times \text{Net Price}$
- Exact 2-decimal precision.
- No unnecessary state libraries or external dependencies beyond `vitest`.
- Every task must pass `npm run build` and `npm run lint`.

---

### Task 1: Setup Test Runner & Pure Pricing Engine with Vitest

**Files:**
- Modify: `package.json`
- Create: `src/types/index.ts`
- Create: `src/lib/pricing.ts`
- Create: `src/lib/pricing.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface Product { ... }
  export interface Customer { ... }
  export interface EstimateRow { ... }
  export interface Quotation { ... }
  export function calculateRow(row: EstimateRow, enableListPriceMode?: boolean): EstimateRow
  export function calculateTotals(rows: EstimateRow[]): { totalUnits: number; totalAmount: number }
  export function formatINR(amount: number): string
  ```

- [ ] **Step 1: Install Vitest**
  Run: `npm install -D vitest`
  Add `"test": "vitest run"` to `package.json` scripts.

- [ ] **Step 2: Create `src/types/index.ts`**
  Extract all domain types from `App.tsx` (`Product`, `Customer`, `EstimateRow`, `Quotation`, etc.).

- [ ] **Step 3: Write tests for `calculateRow`, `calculateTotals`, `formatINR`**
  Cover:
  - Default margin (15%)
  - Custom margin (20%)
  - Percentage discount (5%, 10%)
  - Flat rupee discount (Flag 2)
  - List price mode derivation (Flag 1)
  - Zero quantity and fractional quantities (1.5 Kgs)
  - 2-decimal precision stability

- [ ] **Step 4: Implement `src/lib/pricing.ts`**
  Implement pure functions matching test expectations.

- [ ] **Step 5: Run tests to verify they pass**
  Run: `npm test`
  Expected: All pricing unit tests pass.

- [ ] **Step 6: Commit**
  ```bash
  git add package.json package-lock.json src/types/index.ts src/lib/pricing.ts src/lib/pricing.test.ts
  git commit -m "feat(pricing): add pure pricing engine with vitest unit tests"
  ```

---

### Task 2: Extract Print Slip & WhatsApp Utilities

**Files:**
- Create: `src/lib/whatsapp.ts`
- Create: `src/components/Slip/PrintSlipModal.tsx`

**Interfaces:**
- Produces:
  ```ts
  export function generateWhatsAppMessage(data: PrintQuoteData): string
  export const PrintSlipModal: React.FC<PrintSlipModalProps>
  ```

- [ ] **Step 1: Create `src/lib/whatsapp.ts`**
  Extract WhatsApp message builder logic and URI encoder from `App.tsx`.

- [ ] **Step 2: Create `src/components/Slip/PrintSlipModal.tsx`**
  Move the complete `#printable-estimate-slip` modal with the Om symbol, company details, grid table, and print buttons into this component.

- [ ] **Step 3: Verify build**
  Run: `npm run build`

- [ ] **Step 4: Commit**
  ```bash
  git add src/lib/whatsapp.ts src/components/Slip/PrintSlipModal.tsx
  git commit -m "refactor: extract PrintSlipModal and whatsapp utilities"
  ```

---

### Task 3: Extract Customer & Product View Components

**Files:**
- Create: `src/components/Customers/CustomerDirectory.tsx`
- Create: `src/components/Customers/AddCustomerModal.tsx`
- Create: `src/components/Products/ProductsCatalog.tsx`
- Create: `src/components/Products/AddProductModal.tsx`

**Interfaces:**
- Produces:
  ```ts
  export const CustomerDirectory: React.FC<CustomerDirectoryProps>
  export const AddCustomerModal: React.FC<AddCustomerModalProps>
  export const ProductsCatalog: React.FC<ProductsCatalogProps>
  export const AddProductModal: React.FC<AddProductModalProps>
  ```

- [ ] **Step 1: Create Customer Directory & Add Customer Modal**
  Extract customer table and creation modal from `App.tsx`.

- [ ] **Step 2: Create Products Catalog & Add Product Modal**
  Extract product table, search filter, and add/edit product modal from `App.tsx`.

- [ ] **Step 3: Verify build**
  Run: `npm run build`

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/Customers/ src/components/Products/
  git commit -m "refactor: extract Customers and Products views and modals"
  ```

---

### Task 4: Extract Estimator POS, Dashboard & Navigation Components

**Files:**
- Create: `src/components/Layout/Sidebar.tsx`
- Create: `src/components/Dashboard/DashboardView.tsx`
- Create: `src/components/Estimator/EstimatorView.tsx`
- Create: `src/components/Settings/AdminSettingsView.tsx`

**Interfaces:**
- Produces:
  ```ts
  export const Sidebar: React.FC<SidebarProps>
  export const DashboardView: React.FC<DashboardViewProps>
  export const EstimatorView: React.FC<EstimatorViewProps>
  export const AdminSettingsView: React.FC<AdminSettingsViewProps>
  ```

- [ ] **Step 1: Create `Sidebar.tsx`**
  Extract navigation sidebar, brand card, and Turso Cloud DB status indicator.

- [ ] **Step 2: Create `DashboardView.tsx`**
  Extract recent quotation history table and quick action cards.

- [ ] **Step 3: Create `EstimatorView.tsx`**
  Extract customer selector, product search bar, and estimate item table.

- [ ] **Step 4: Create `AdminSettingsView.tsx`**
  Extract feature flag toggles (List Price mode, Flat Rupee discount).

- [ ] **Step 5: Verify build**
  Run: `npm run build`

- [ ] **Step 6: Commit**
  ```bash
  git add src/components/Layout/ src/components/Dashboard/ src/components/Estimator/ src/components/Settings/
  git commit -m "refactor: extract Sidebar, Dashboard, Estimator, and AdminSettings views"
  ```

---

### Task 5: Streamline `App.tsx` & End-to-End Verification

**Files:**
- Modify: `src/App.tsx` (Reduce from 2,400 lines to ~150 lines)

- [ ] **Step 1: Assemble clean `App.tsx`**
  Import extracted components, shared state, and loaders into `App.tsx`.
  Remove duplicated inline functions and unused code.

- [ ] **Step 2: Run test suite**
  Run: `npm test`
  Verify all unit tests pass.

- [ ] **Step 3: Run linter and build**
  Run: `npm run lint && npm run build`
  Verify 0 errors.

- [ ] **Step 4: Run Playwright E2E browser test**
  Run: `node scratch/playwright_e2e.cjs`
  Confirm all UI flows (login, customer, product, estimator, save, slip) work identically.

- [ ] **Step 5: Commit and Deploy to PROD**
  ```bash
  git add src/App.tsx
  git commit -m "refactor: streamline App.tsx root component"
  git push origin main
  ```
