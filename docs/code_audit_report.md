# Code Audit Report

**Project:** PowerPlay Invoice Dashboard
**Date:** 2026-06-07
**Auditor:** Staff QA Engineer

---

## Executive Summary

The codebase is a full-stack MERN application with React frontend and Express/MongoDB backend. Overall code quality is moderate with several issues ranging from silent API failures to missing validation to potential memory leaks.

---

## BACKEND ISSUES

### 1. Silent Error Handling in Services

**File:** `backend/services/InvoiceService.js` (updateInvoice method)

**Issue:** When `updateInvoice` recalculates tax/total, it uses `data.total` which hasn't been set yet:

```javascript
data.tax = (amount * taxRate) / 100;
data.total = amount + data.tax;  // data.tax is correct, but this is confusing
```

**Severity:** Medium
**Impact:** Calculation is actually correct (amount + tax), but the variable naming is misleading and could lead to future bugs.

---

### 2. Missing Validation - Customer Name Not Unique

**File:** `backend/models/Customer.js`

**Issue:** No unique constraint on customer name. Multiple customers can have the same name, making `getTopCustomers` results ambiguous.

**Severity:** Low
**Impact:** Analytics may show incorrect top customer data if duplicate names exist.

---

### 3. Incomplete Index Coverage

**File:** `backend/models/Customer.js`

**Issue:** Search by name and company uses case-insensitive regex (`$regex: 'i'`), which cannot use the existing simple indexes efficiently.

```javascript
// In CustomerService.js getCustomers:
filter.$or = [
  { name: { $regex: search, $options: 'i' } },
  { company: { $regex: search, $options: 'i' } }
];
```

**Severity:** Medium
**Impact:** Search queries will perform collection scans on large datasets.

---

### 4. UUID Dependency Not Verified

**File:** `backend/services/InvoiceService.js`

**Issue:** Uses `import { v4 as uuidv4 } from 'uuid'` but `uuid` is not in the visible package.json imports.

**Severity:** High
**Impact:** Application will crash at runtime if `uuid` is not installed.

---

### 5. Aggregation Pipeline Missing Limit Safeguard

**File:** `backend/services/CustomerService.js` (getTopCustomers)

**Issue:** Pipeline does not validate the `limit` parameter before passing to aggregation. A very large limit could cause memory issues.

**Severity:** Low
**Impact:** Potential performance degradation with unbounded limits.

---

### 6. No Connection Reuse for Aggregations

**File:** `backend/services/AnalyticsService.js`

**Issue:** `getSummary()` runs three separate aggregations:
- `countDocuments()`
- `$group` for total revenue
- `$group` for status breakdown

**Severity:** Low
**Impact:** Three round trips to the database. Could be combined into a single aggregation pipeline with `$facet`.

---

### 7. Missing Input Validation on Service Layer

**File:** `backend/services/InvoiceService.js` (createInvoice)

**Issue:** Accepts any numeric values for `amount` and `taxRate` without server-side validation beyond schema. Negative amounts could still pass if schema validation is bypassed.

**Severity:** Low
**Impact:** Data integrity issues with malformed input.

---

## FRONTEND ISSUES

### 1. CRITICAL: Silent API Failures - Empty Catch Blocks

**Files:**
- `frontend/src/components/AnalyticsSummary.jsx`
- `frontend/src/components/TopCustomers.jsx`

**Issue:** Both components have `.catch(() => {})` which silently swallows all errors. Users see "Loading..." indefinitely when API fails.

```javascript
// AnalyticsSummary.jsx
useEffect(() => {
  analyticsApi.getSummary().then(({ data }) => {
    setData(data)
  }).catch(() => {}).finally(() => {
    setLoading(false)
  })
}, [])
```

**Severity:** Critical
**Impact:** Users receive no feedback on API errors. App appears broken without explanation.

---

### 2. Missing Loading State in InvoiceForm

**File:** `frontend/src/components/InvoiceForm.jsx`

**Issue:** No loading state when fetching customers. Component renders empty select before customer list loads.

```javascript
useEffect(() => {
  customerApi.list({ limit: 100 }).then(({ data }) => {
    setCustomers(data.customers)
  })
}, [])
```

**Severity:** Medium
**Impact:** User may see empty dropdown briefly or attempt submission before customers are loaded.

---

### 3. Missing Error State in InvoiceForm

**File:** `frontend/src/components/InvoiceForm.jsx`

**Issue:** No error handling if customer list fetch fails. Users cannot tell why dropdown is empty.

**Severity:** Medium
**Impact:** Poor UX when customer API is down.

---

### 4. Missing Empty State in InvoiceForm

**File:** `frontend/src/components/InvoiceForm.jsx`

**Issue:** If `customers` array is empty after load, component renders "Select customer" with no visible indication that no customers exist.

**Severity:** Low
**Impact:** User may think dropdown is loading when it's actually empty.

---

### 5. Missing Loading State in FilterBar

**File:** `frontend/src/components/FilterBar.jsx`

**Issue:** The component accepts `filters`, `onChange`, and `onClear` props but has no loading/disabled state. UI doesn't indicate when filters are being applied.

**Severity:** Low
**Impact:** Minor UX issue during filter changes.

---

### 6. Unused Import

**File:** `frontend/src/components/TopCustomers.jsx`

**Issue:** `Link` is imported but component uses no link navigation. The customer name display uses plain `div`, not `Link`.

**Severity:** Low
**Impact:** Dead code, slightly increased bundle size.

---

### 7. Inconsistent Currency Formatting

**Files:** Multiple components

**Issue:** Currency formatting is duplicated across components using different approaches:
- `AnalyticsSummary.jsx`: `₹${amount.toLocaleString('en-IN', ...)}`
- `InvoiceTable.jsx`: Same pattern
- `TopCustomers.jsx`: Same pattern

**Severity:** Low
**Impact:** Inconsistent formatting if specifications change. Code duplication.

---

### 8. Customer Profile Missing Loading State

**File:** `frontend/src/pages/CustomerProfilePage.jsx`

**Issue:** Uses boolean `loading` state but doesn't render a spinner or skeleton. Only shows "Loading..." text.

**Severity:** Low
**Impact:** Poor perceived performance during data fetch.

---

### 9. No Empty State in Customer Profile

**File:** `frontend/src/pages/CustomerProfilePage.jsx`

**Issue:** If customer exists but has no invoices, `InvoiceTable` shows "No invoices found" message, but the overall layout doesn't indicate this clearly.

**Severity:** Low
**Impact:** Minor UX issue for customers with no invoices.

---

### 10. Potential Memory Leak - useEffect Cleanup

**Files:** All components using useEffect with API calls

**Issue:** None of the useEffect hooks have cleanup functions. If a component unmounts while an API call is pending, the `setState` call will execute on an unmounted component.

**Severity:** Medium
**Impact:** React warnings in development mode, potential memory leaks in production.

---

### 11. DashboardPage Effect Dependencies

**File:** `frontend/src/pages/DashboardPage.jsx`

**Issue:** `useEffect` depends on `filters.page` but `fetchInvoices` is defined outside the effect. If `fetchInvoices` changes reference, the effect won't re-run.

```javascript
const fetchInvoices = async () => { ... }

useEffect(() => {
  fetchInvoices()
}, [filters.page])  // fetchInvoices not in deps
```

**Severity:** Low
**Impact:** Stale closure if `fetchInvoices` is memoized incorrectly.

---

## DEAD CODE / UNUSED EXPORTS

### Backend

| File | Issue |
|------|-------|
| `backend/routes/index.js` | All imports used |
| `backend/routes/invoiceRoutes.js` | All imports used |
| `backend/routes/customerRoutes.js` | All imports used |
| `backend/routes/analyticsRoutes.js` | All imports used |

### Frontend

| File | Issue |
|------|-------|
| `frontend/src/components/TopCustomers.jsx` | `Link` imported but not used |

---

## DUPLICATE LOGIC

### Currency Formatting

Repeated across 4 files:
- `AnalyticsSummary.jsx`
- `InvoiceTable.jsx`
- `TopCustomers.jsx`
- `CustomerProfilePage.jsx` (indirectly through InvoiceTable)

**Recommendation:** Create a shared utility function `formatCurrency(amount)`.

---

## MISSING VALIDATION

1. **Invoice status transitions**: No validation that status changes are valid (e.g., cannot go from `paid` to `draft` in certain workflows).

2. **Due date > Issue date**: No validation that `dueDate` is after `issueDate`.

3. **Duplicate invoiceId**: While `invoiceId` has a unique index, there's no retry logic if collision occurs during generation.

4. **Customer deletion with invoices**: Deleting a customer doesn't handle existing invoices (foreign key).

---

## SUMMARY TABLE

| Category | Count | Critical |
|----------|-------|----------|
| Silent API failures | 2 | Yes |
| Missing loading states | 3 | No |
| Missing error handling | 2 | No |
| Missing empty states | 2 | No |
| Memory leak potential | 1 | No |
| Unused imports | 1 | No |
| Duplicate logic | 1 | No |
| Missing validation | 4 | No |

**Total Issues:** 16
**Critical Issues:** 2 (silent API failures)

---

## RECOMMENDATIONS

1. **Immediate**: Fix silent catch blocks in `AnalyticsSummary` and `TopCustomers`
2. **High Priority**: Add error boundaries and toast notifications for API failures
3. **Medium Priority**: Add cleanup functions to useEffect hooks
4. **Low Priority**: Extract currency formatting to shared utility
5. **Low Priority**: Add input validation for dates and status transitions