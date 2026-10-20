# UX Feedback Systems Implementation Plan: Loading Screens, Error Popups & Success Modals

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive, unified UI feedback system covering branded initial splash loading, table/card skeleton loaders, high-impact error recovery popups (with emergency offline printing), and master catalog sync success modals.

**Architecture:** Create modular, isolated UI components in `src/components/Common/` (`AppSplashScreen`, `SkeletonLoaders`, `ErrorModal`, `CatalogSyncSuccessModal`) and integrate them into `src/App.tsx`, `DashboardView.tsx`, `ProductsCatalog.tsx`, and `HeroProductsView.tsx` with dedicated loading and error states.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React icons, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-20-feedback-systems-design.md`

## Global Constraints
- Must maintain 100% responsiveness on mobile, tablet, and desktop screens.
- Must not block shopkeepers from printing an estimate if network/cloud save encounters errors (Emergency Print Slip must remain accessible).
- Must adhere strictly to Git Rules: NEVER add or commit `HANDOFF.md` or `handoff.md`.

---

### Task 1: Reusable Skeleton Loaders (`TableSkeleton` and `CardGridSkeleton`)

**Files:**
- Create: `src/components/Common/SkeletonLoaders.tsx`
- Create: `src/components/Common/SkeletonLoaders.test.tsx`

**Interfaces:**
- Produces:
  - `TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }>`
  - `CardGridSkeleton: React.FC<{ count?: number; className?: string }>`

- [ ] **Step 1: Write failing unit test for `SkeletonLoaders`**

```tsx
// src/components/Common/SkeletonLoaders.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { TableSkeleton, CardGridSkeleton } from './SkeletonLoaders'

describe('SkeletonLoaders', () => {
  it('renders TableSkeleton with specified rows and columns', () => {
    const { container } = render(<TableSkeleton rows={4} columns={5} />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBe(4)
    const cells = container.querySelectorAll('tbody tr:first-child td')
    expect(cells.length).toBe(5)
  })

  it('renders CardGridSkeleton with specified count', () => {
    const { container } = render(<CardGridSkeleton count={6} />)
    const cards = container.querySelectorAll('.skeleton-card')
    expect(cards.length).toBe(6)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/Common/SkeletonLoaders.test.tsx`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `SkeletonLoaders.tsx`**

```tsx
// src/components/Common/SkeletonLoaders.tsx
import React from 'react'

export interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 6,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-hidden animate-pulse ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <th key={cIdx} className="p-3">
                <div className="h-3.5 bg-slate-200 rounded-md w-3/4 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/30">
              {Array.from({ length: columns }).map((_, cIdx) => (
                <td key={cIdx} className="p-3">
                  <div
                    className="h-3 bg-slate-100 rounded-md mx-auto"
                    style={{
                      width: `${Math.floor(50 + ((rIdx * 17 + cIdx * 29) % 45))}%`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export interface CardGridSkeletonProps {
  count?: number
  className?: string
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-card rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3.5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-6 w-12 bg-slate-100 rounded-full" />
          </div>
          <div className="h-3 bg-slate-100 rounded w-3/4" />
          <div className="pt-2 border-t border-slate-100 flex justify-between">
            <div className="h-3 bg-slate-100 rounded w-1/4" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/Common/SkeletonLoaders.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Common/SkeletonLoaders.tsx src/components/Common/SkeletonLoaders.test.tsx
git commit -m "feat(ui): add reusable table and card skeleton loaders"
```

---

### Task 2: Branded Full-Screen App Splash Loader (`AppSplashScreen`)

**Files:**
- Create: `src/components/Common/AppSplashScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes:
  - `statusMessage?: string`
  - `isDbConnected?: boolean`
- Produces:
  - `AppSplashScreen: React.FC<{ statusMessage?: string; isDbConnected?: boolean }>`

- [ ] **Step 1: Create `src/components/Common/AppSplashScreen.tsx`**

Implement full-screen branded splash screen featuring Sri Venkateshwara emblem, animated pulse ring, and real-time database sync badge.

- [ ] **Step 2: Add `isInitialLoading` state to `src/App.tsx`**

Track initial load of `checkDb()`, `loadCustomers()`, `loadProducts()`, `loadHeroProducts()`, and `loadQuotations()` in `Promise.allSettled`, setting `isInitialLoading = false` once complete.

- [ ] **Step 3: Run build & test**

Run: `npm run build`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/Common/AppSplashScreen.tsx src/App.tsx
git commit -m "feat(ui): add branded initial splash screen on cold start"
```

---

### Task 3: Critical Error Recovery Modal (`ErrorModal`) with Emergency Offline Print

**Files:**
- Create: `src/components/Common/ErrorModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces:
  - `ErrorModal: React.FC<ErrorModalProps>`
  - Callbacks: `onRetry?: () => void`, `onEmergencyPrint?: () => void`, `onCopyDebug?: () => void`, `onClose: () => void`

- [ ] **Step 1: Create `src/components/Common/ErrorModal.tsx`**

Features bold alert banner, detailed error diagnostics, "Emergency Print Bill" (allows shopkeeper to print physical bill for the waiting customer even if saving to cloud failed), "Retry Connection", and "Dismiss".

- [ ] **Step 2: Wire Error Recovery in `src/App.tsx`**

In `executeSaveQuotation` and `handleSaveEstimateRequest`, catch failures and trigger `ErrorModal` with `onEmergencyPrint: () => setShowPrintModal(true)`.

- [ ] **Step 3: Run build & test**

Run: `npm run build && npm test -- --run`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/Common/ErrorModal.tsx src/App.tsx
git commit -m "feat(ui): add critical error recovery modal with emergency print"
```

---

### Task 4: Master Catalog Price Sync Success Modal (`CatalogSyncSuccessModal`)

**Files:**
- Create: `src/components/Common/CatalogSyncSuccessModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces:
  - `CatalogSyncSuccessModal: React.FC<{ isOpen: boolean; items: CatalogUpdateItem[]; onClose: () => void }>`

- [ ] **Step 1: Create `src/components/Common/CatalogSyncSuccessModal.tsx`**

Displays an itemized celebration table when products are updated in the master database via `[DB]` toggle, showing Product Name, Revised List, Trade Dis%, Cost, and Margin%.

- [ ] **Step 2: Wire in `src/App.tsx`**

When `rowsToUpdate` are saved in `executeSaveQuotation`, trigger `CatalogSyncSuccessModal` to show the itemized confirmation.

- [ ] **Step 3: Run build & test**

Run: `npm run build && npm test -- --run`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/Common/CatalogSyncSuccessModal.tsx src/App.tsx
git commit -m "feat(ui): add master catalog price sync success modal"
```

---

### Task 5: Integrate Skeletons in `DashboardView`, `ProductsCatalog`, & `HeroProductsView`

**Files:**
- Modify: `src/components/Dashboard/DashboardView.tsx`
- Modify: `src/components/Products/ProductsCatalog.tsx`
- Modify: `src/components/HeroProducts/HeroProductsView.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `isLoading?: boolean` to view props**
- [ ] **Step 2: Replace empty state flicker with `TableSkeleton` / `CardGridSkeleton` while `isLoading` is true**
- [ ] **Step 3: Run all unit tests and verify 0 regressions**
- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard/DashboardView.tsx src/components/Products/ProductsCatalog.tsx src/components/HeroProducts/HeroProductsView.tsx src/App.tsx
git commit -m "feat(ui): integrate table and card skeletons across all main views"
```

---

### Task 6: End-to-End QA, Production Push & Live Verification

- [ ] **Step 1: Run full test suite & production bundle build**

Run: `npm test -- --run && npm run build`

- [ ] **Step 2: Push commit to `origin/main` (Vercel deployment)**

Run: `git push origin main`

- [ ] **Step 3: Live Production Verification**

Verify Vercel HTTP 200, assets bundle, and DB connectivity.
