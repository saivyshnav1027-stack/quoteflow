# UX Feedback Systems Design Spec: Loading Screens, Error Popups & Success Modals

**Date:** 2026-10-20  
**Status:** Approved  
**Author:** Pair Programming Session with Sri Venkateshwara Traders  

---

## 1. Context & Problem Statement

QuoteFlow operates in a high-volume rural counter environment (Sri Venkateshwara Trading & Co). During peak hours:
1. **Cold starts / Page reloads:** The app currently mounts with empty state arrays (`products: []`, `quotations: []`), momentarily flashing "No estimates created yet" or blank tables before Turso Cloud DB queries resolve.
2. **Critical Counter Failures:** If an internet drop or DB latency occurs while clicking "Save Estimate", the current app only emits a transient toast in the top corner. If unhandled, walk-in customers wait while the shopkeeper is unsure if the quote was saved, and physical bills cannot be printed.
3. **Master Catalog DB Sync Visibility:** When shopkeepers toggle `[DB]` to update master prices from the Estimator, they need explicit, transparent feedback showing which products, trade discounts, and margins were permanently saved.

---

## 2. System Architecture & Components

```
┌────────────────────────────────────────────────────────────────────────┐
│                        APP LIFECYCLE & USER FLOWS                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  LOADING STATES  │      │  ERROR HANDLING  │      │ SUCCESS POPUPS   │
└────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
         │                         │                         │
 ┌───────┴───────┐         ┌───────┴───────┐         ┌───────┴───────┐
 │1. App Splash  │         │1. Error Modal │         │1. High-Impact │
 │   Loader      │         │   (Critical   │         │   Modal Popup │
 │               │         │   + Offline   │         │   (Save /     │
 │2. Table & Card│         │   Recovery)   │         │    Sync)      │
 │   Skeletons   │         │               │         │               │
 │               │         │2. Transient   │         │2. Micro-Toast │
 │3. Action      │         │   Toasts      │         │   Feedback    │
 │   Spinners    │         │               │         │               │
 └───────────────┘         └───────────────┘         └───────────────┘
```

### Component Breakdown

1. **`AppSplashScreen.tsx` (`src/components/Common/AppSplashScreen.tsx`)**
   - Full-screen branded loading experience on cold boot.
   - Displays Sri Venkateshwara emblem, live connection pulse, and step-by-step loading progression (*"Connecting to Turso Cloud DB..."* $\rightarrow$ *"Loading Master Catalog & Quotations..."*).
   - Automatically unmounts with a smooth opacity fade-out once `isInitialLoading` resolves.

2. **`SkeletonLoaders.tsx` (`src/components/Common/SkeletonLoaders.tsx`)**
   - `TableSkeleton`: Configurable row count (default 5) and column widths with shimmering pulse gradient.
   - `CardGridSkeleton`: Shimmering card blocks for the Hero Products view.
   - Replaces empty table flashes across `DashboardView.tsx`, `ProductsCatalog.tsx`, and `HeroProductsView.tsx`.

3. **`ErrorModal.tsx` (`src/components/Common/ErrorModal.tsx`)**
   - High-impact error modal with bold visual hierarchy (Rose palette, warning icon, action buttons).
   - Special emergency recovery mode for Estimate Save failures:
     - **"Emergency Print Bill"**: Opens print preview immediately using local active state, allowing the customer to receive their physical bill regardless of cloud downtime.
     - **"Retry Cloud Sync"**: Re-executes the API call without losing entered estimate items.
     - **"Copy Offline Backup"**: Copies full quotation JSON payload to clipboard as an emergency backup.

4. **`CatalogSyncSuccessModal.tsx` (`src/components/Common/CatalogSyncSuccessModal.tsx`)**
   - Dedicated celebration modal when `[DB]` price changes are permanently committed to the master catalog.
   - Itemizes each updated product: Product Name, revised List Price, revised Trade Dis%, revised Cost Price, and revised Margin%.

5. **`EstimateSavedModal.tsx` (Enhanced)**
   - Displays prominent estimate badge `#SVT-YYYYMMDD-XX`, customer name, payable amount, and one-click actions:
     - 🖨️ Print Slip
     - 💬 WhatsApp Quote
     - ➕ Next Estimate (resets estimator for next walk-in)

6. **`Toast.tsx` (Enhanced)**
   - Improved slide-in and progress countdown timer for transient notifications.

---

## 3. Data Flow & Integration Points

- **`src/App.tsx` State Additions:**
  - `isInitialLoading: boolean` (tracks initial boot: `checkDb()`, `loadCustomers()`, `loadProducts()`, `loadHeroProducts()`, `loadQuotations()`).
  - `isQuotationsLoading: boolean` (passed to `DashboardView`).
  - `isProductsLoading: boolean` (passed to `ProductsCatalog`).
  - `isHeroLoading: boolean` (passed to `HeroProductsView`).
  - `errorModalState: ErrorModalProps | null` (global critical error overlay).
  - `catalogSyncSuccessData: { products: CatalogUpdateSummary[] } | null` (catalog sync summary).
- **Offline / Save Error Handling:**
  - Wrapped `executeSaveQuotation` in try/catch that catches network/fetch errors or API `res.ok === false` and dispatches `errorModalState` with Emergency Print Slip handler.

---

## 4. Testing Strategy

1. **Unit Tests (`src/components/Common/__tests__/`):**
   - Verify `SkeletonLoaders` render correct column/row count.
   - Verify `ErrorModal` renders emergency print and retry callbacks.
   - Verify `AppSplashScreen` lifecycle unmounting.
2. **QA & Build:**
   - `npm test -- --run`
   - `npm run build`
3. **Production Deployment & Verification:**
   - Commit & push to `origin/main` (Vercel).
   - Test endpoints & bundle verification.
