# Invoice Dashboard — API Documentation

**Base URL:** `http://localhost:5000/api`  
**Format:** All request and response bodies use `application/json`  
**Authentication:** Not yet implemented — all endpoints are publicly accessible  
**Date format:** ISO 8601 (`2025-01-15T00:00:00.000Z`)

---

## Table of Contents

- [Health Check](#health-check)
- [Invoices](#invoices)
  - [List Invoices](#get-apinvoices)
  - [Get Invoice](#get-apinvoicesid)
  - [Create Invoice](#post-apinvoices)
  - [Update Invoice](#put-apinvoicesid)
  - [Delete Invoice](#delete-apinvoicesid)
- [Customers](#customers)
  - [List Customers](#get-apicustomers)
  - [Get Customer](#get-apicustomersid)
  - [Create Customer](#post-apicustomers)
  - [Update Customer](#put-apicustomersid)
  - [Delete Customer](#delete-apicustomersid)
  - [Get Customer with Invoices](#get-apicustomersidinvoices)
- [Analytics](#analytics)
  - [Get Summary](#get-apianalyticssummary)
  - [Get Top Customers](#get-apianalyticstop-customers)

---

## Health Check

### GET /health

Returns service health and database connectivity status.

**Auth required:** No

**Response `200 OK`**

```json
{
  "status": "ok",
  "database": "connected",
  "uptime": "3600s"
}
```

| Field     | Description                                                    |
|-----------|----------------------------------------------------------------|
| `status`  | `"ok"` when MongoDB is connected, `"error"` otherwise          |
| `database`| MongoDB connection state: `connected`, `disconnected`, etc.    |
| `uptime`  | Process uptime in seconds                                      |

**Error responses**

| Status | Body                        | Condition                  |
|--------|-----------------------------|----------------------------|
| `500`  | `{ "status": "error", ... }` | MongoDB not connected      |

---

## Invoices

### GET /api/invoices

Returns a paginated list of invoices. Supports filtering by status, customer, and date range.

**Auth required:** No

**Query parameters**

| Parameter       | Type     | Default | Description                                       |
|-----------------|----------|---------|---------------------------------------------------|
| `page`          | integer  | `1`     | Page number (1-indexed)                           |
| `limit`         | integer  | `10`    | Items per page (max 100)                          |
| `status`        | string   | —       | Filter by status: `draft`, `pending`, `paid`, `overdue`, `cancelled` |
| `customerId`    | string   | —       | Filter by customer MongoDB ObjectId               |
| `issueDateFrom` | string   | —       | Filter invoices issued on or after this date      |
| `issueDateTo`   | string   | —       | Filter invoices issued on or before this date     |
| `dueDateFrom`   | string   | —       | Filter invoices due on or after this date         |
| `dueDateTo`     | string   | —       | Filter invoices due on or before this date        |
| `sortBy`        | string   | `dueDate` | Sort field: `dueDate`, `amount`                 |
| `sortOrder`     | string   | `asc`   | Sort direction: `asc`, `desc`                     |

**Example request**

```
GET /api/invoices?status=paid&page=1&limit=5&sortBy=amount&sortOrder=desc
```

**Response `200 OK`**

```json
{
  "invoices": [
    {
      "_id": "674f1a2b3c4d5e6f7a8b9c0d",
      "invoiceId": "INV-ABC123",
      "customerId": {
        "_id": "674f1a2b3c4d5e6f7a8b9c0e",
        "name": "Aarav Sharma",
        "company": "Infosys Technologies"
      },
      "amount": 1500.00,
      "taxRate": 18,
      "tax": 270.00,
      "total": 1770.00,
      "status": "paid",
      "issueDate": "2025-01-15T00:00:00.000Z",
      "dueDate": "2025-02-15T00:00:00.000Z",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 42,
    "pages": 9
  }
}
```

**Error responses**

| Status | Body                          | Condition              |
|--------|-------------------------------|------------------------|
| `500`  | `{ "error": "..." }`          | Database error         |

---

### GET /api/invoices/:id

Returns a single invoice by its MongoDB ObjectId. Customer data is populated via `$lookup`.

**Auth required:** No

**Path parameters**

| Parameter | Type   | Description              |
|-----------|--------|--------------------------|
| `id`      | string | MongoDB ObjectId of the invoice |

**Example request**

```
GET /api/invoices/674f1a2b3c4d5e6f7a8b9c0d
```

**Response `200 OK`**

```json
{
  "_id": "674f1a2b3c4d5e6f7a8b9c0d",
  "invoiceId": "INV-ABC123",
  "customerId": {
    "_id": "674f1a2b3c4d5e6f7a8b9c0e",
    "name": "Aarav Sharma",
    "company": "Infosys Technologies"
  },
  "amount": 1500.00,
  "taxRate": 18,
  "tax": 270.00,
  "total": 1770.00,
  "status": "paid",
  "issueDate": "2025-01-15T00:00:00.000Z",
  "dueDate": "2025-02-15T00:00:00.000Z",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Error responses**

| Status | Body                       | Condition                  |
|--------|----------------------------|----------------------------|
| `404`  | `{ "error": "Invoice not found" }` | Invoice ID does not exist |
| `500`  | `{ "error": "..." }`       | Database error             |

---

### POST /api/invoices

Creates a new invoice. The `invoiceId` is auto-generated (format: `INV-{short-uuid}`). The `tax` and `total` fields are computed automatically from `amount` and `taxRate` — you do not need to provide them.

**Auth required:** No

**Request body**

```json
{
  "customerId": "674f1a2b3c4d5e6f7a8b9c0e",
  "amount": 1500.00,
  "taxRate": 18,
  "status": "draft",
  "issueDate": "2025-01-15T00:00:00.000Z",
  "dueDate": "2025-02-15T00:00:00.000Z"
}
```

| Field       | Type    | Required | Description                                              |
|-------------|---------|----------|----------------------------------------------------------|
| `customerId`| string  | Yes      | MongoDB ObjectId of an existing customer                 |
| `amount`    | number  | Yes      | Pre-tax subtotal (must be >= 0)                          |
| `taxRate`   | number  | Yes      | Tax percentage 0–100                                     |
| `status`    | string  | No       | `draft` (default), `pending`, `paid`, `overdue`, `cancelled` |
| `issueDate` | string  | Yes      | ISO 8601 date-time                                       |
| `dueDate`   | string  | Yes      | Must be after `issueDate`                                |

**Computed fields (do not send these — they are ignored)**

| Field  | How computed           |
|--------|------------------------|
| `tax`  | `(amount * taxRate) / 100` |
| `total`| `amount + tax`         |
| `invoiceId` | Auto: `INV-{uppercase-8-char-uuid}` |

**Example response `201 Created`**

```json
{
  "_id": "674f1a2b3c4d5e6f7a8b9c0d",
  "invoiceId": "INV-A1B2C3D4",
  "customerId": "674f1a2b3c4d5e6f7a8b9c0e",
  "amount": 1500.00,
  "taxRate": 18,
  "tax": 270.00,
  "total": 1770.00,
  "status": "draft",
  "issueDate": "2025-01-15T00:00:00.000Z",
  "dueDate": "2025-02-15T00:00:00.000Z",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Error responses**

| Status | Body                           | Condition                               |
|--------|--------------------------------|-----------------------------------------|
| `400`  | `{ "error": "..." }`           | Missing required field, invalid ObjectId, dueDate before issueDate, or amount < 0 |
| `400`  | `{ "error": "..." }`           | Invalid customerId (not a valid ObjectId or customer does not exist) |
| `500`  | `{ "error": "..." }`           | Database error                          |

---

### PUT /api/invoices/:id

Updates an existing invoice. If `amount` or `taxRate` is modified, `tax` and `total` are recalculated automatically.

**Auth required:** No

**Path parameters**

| Parameter | Type   | Description              |
|-----------|--------|--------------------------|
| `id`      | string | MongoDB ObjectId of the invoice |

**Request body** — all fields optional; only send what you want to change

```json
{
  "amount": 2000.00,
  "taxRate": 12,
  "status": "paid"
}
```

| Field       | Type   | Description                                                    |
|-------------|--------|----------------------------------------------------------------|
| `customerId`| string | New customer ObjectId (invoice will be transferred)            |
| `amount`    | number | New pre-tax subtotal (triggers recalculation of tax and total) |
| `taxRate`   | number | New tax rate (triggers recalculation of tax and total)         |
| `status`    | string | `draft`, `pending`, `paid`, `overdue`, or `cancelled`          |
| `issueDate` | string | ISO 8601 date-time                                             |
| `dueDate`   | string | Must be after `issueDate`                                      |

**Example response `200 OK`**

```json
{
  "_id": "674f1a2b3c4d5e6f7a8b9c0d",
  "invoiceId": "INV-A1B2C3D4",
  "customerId": {
    "_id": "674f1a2b3c4d5e6f7a8b9c0e",
    "name": "Aarav Sharma",
    "company": "Infosys Technologies"
  },
  "amount": 2000.00,
  "taxRate": 12,
  "tax": 240.00,
  "total": 2240.00,
  "status": "paid",
  "issueDate": "2025-01-15T00:00:00.000Z",
  "dueDate": "2025-02-15T00:00:00.000Z",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-16T08:00:00.000Z"
}
```

**Error responses**

| Status | Body                                 | Condition                    |
|--------|--------------------------------------|------------------------------|
| `400`  | `{ "error": "..." }`                 | Validation error             |
| `404`  | `{ "error": "Invoice not found" }`  | Invoice ID does not exist    |
| `500`  | `{ "error": "..." }`                 | Database error               |

---

### DELETE /api/invoices/:id

Permanently deletes an invoice.

**Auth required:** No

**Path parameters**

| Parameter | Type   | Description              |
|-----------|--------|--------------------------|
| `id`      | string | MongoDB ObjectId of the invoice |

**Example request**

```
DELETE /api/invoices/674f1a2b3c4d5e6f7a8b9c0d
```

**Example response `200 OK`**

```json
{
  "message": "Invoice deleted"
}
```

**Error responses**

| Status | Body                                | Condition                   |
|--------|-------------------------------------|-----------------------------|
| `404`  | `{ "error": "Invoice not found" }` | Invoice ID does not exist   |
| `500`  | `{ "error": "..." }`                | Database error              |

---

## Customers

### GET /api/customers

Returns a paginated list of customers. Supports prefix-search on `name` and `company`.

**Auth required:** No

**Query parameters**

| Parameter | Type    | Default | Description                                    |
|-----------|---------|---------|------------------------------------------------|
| `page`    | integer | `1`     | Page number (1-indexed)                        |
| `limit`   | integer | `10`    | Items per page                                 |
| `search`  | string  | —       | Prefix-match search on name and company (case-insensitive) |

**Example request**

```
GET /api/customers?search=Aara&page=1&limit=5
```

**Response `200 OK`**

```json
{
  "customers": [
    {
      "_id": "674f1a2b3c4d5e6f7a8b9c0e",
      "name": "Aarav Sharma",
      "company": "Infosys Technologies",
      "createdAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-01-10T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "pages": 1
  }
}
```

**Notes**
- `search` uses regex anchored at start (`^query`) for performance
- Special regex characters in `search` are escaped to prevent injection

**Error responses**

| Status | Body                  | Condition          |
|--------|-----------------------|--------------------|
| `500`  | `{ "error": "..." }`  | Database error     |

---

### GET /api/customers/:id

Returns a single customer by MongoDB ObjectId.

**Auth required:** No

**Path parameters**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `id`      | string | MongoDB ObjectId of the customer |

**Example request**

```
GET /api/customers/674f1a2b3c4d5e6f7a8b9c0e
```

**Response `200 OK`**

```json
{
  "_id": "674f1a2b3c4d5e6f7a8b9c0e",
  "name": "Aarav Sharma",
  "company": "Infosys Technologies",
  "createdAt": "2025-01-10T09:00:00.000Z",
  "updatedAt": "2025-01-10T09:00:00.000Z"
}
```

**Error responses**

| Status | Body                              | Condition                 |
|--------|-----------------------------------|---------------------------|
| `404`  | `{ "error": "Customer not found" }` | Customer ID does not exist |
| `500`  | `{ "error": "..." }`              | Database error            |

---

### POST /api/customers

Creates a new customer.

**Auth required:** No

**Request body**

```json
{
  "name": "Radha Krishnan",
  "company": "Freshworks Software"
}
```

| Field    | Type   | Required | Description                     |
|----------|--------|----------|---------------------------------|
| `name`   | string | Yes      | Customer full name              |
| `company`| string | No       | Company name                    |

**Example response `201 Created`**

```json
{
  "_id": "674f1a2b3c4d5e6f7a8b9c0f",
  "name": "Radha Krishnan",
  "company": "Freshworks Software",
  "createdAt": "2025-01-10T09:00:00.000Z",
  "updatedAt": "2025-01-10T09:00:00.000Z"
}
```

**Error responses**

| Status | Body                           | Condition              |
|--------|--------------------------------|------------------------|
| `400`  | `{ "error": "..." }`           | `name` is required     |
| `500`  | `{ "error": "..." }`           | Database error         |

---

### PUT /api/customers/:id

Updates an existing customer's name and/or company.

**Auth required:** No

**Path parameters**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `id`      | string | MongoDB ObjectId of the customer |

**Request body** — all fields optional

```json
{
  "name": "Radha Iyer",
  "company": "Zoho Corporation"
}
```

**Example response `200 OK`**

```json
{
  "_id": "674f1a2b3c4d5e6f7a8b9c0f",
  "name": "Radha Iyer",
  "company": "Zoho Corporation",
  "createdAt": "2025-01-10T09:00:00.000Z",
  "updatedAt": "2025-01-16T12:00:00.000Z"
}
```

**Error responses**

| Status | Body                                | Condition                    |
|--------|-------------------------------------|------------------------------|
| `400`  | `{ "error": "..." }`                | Validation error             |
| `404`  | `{ "error": "Customer not found" }` | Customer ID does not exist   |
| `500`  | `{ "error": "..." }`                | Database error               |

---

### DELETE /api/customers/:id

Permanently deletes a customer. Does **not** delete associated invoices — those will retain a null/unpopulated `customerId` reference.

**Auth required:** No

**Path parameters**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `id`      | string | MongoDB ObjectId of the customer |

**Example request**

```
DELETE /api/customers/674f1a2b3c4d5e6f7a8b9c0f
```

**Example response `200 OK`**

```json
{
  "message": "Customer deleted"
}
```

**Error responses**

| Status | Body                                | Condition                   |
|--------|-------------------------------------|-----------------------------|
| `404`  | `{ "error": "Customer not found" }` | Customer ID does not exist  |
| `500`  | `{ "error": "..." }`                | Database error              |

---

### GET /api/customers/:id/invoices

Returns a customer record along with all their invoices, sorted by issue date descending.

**Auth required:** No

**Path parameters**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `id`      | string | MongoDB ObjectId of the customer |

**Example request**

```
GET /api/customers/674f1a2b3c4d5e6f7a8b9c0e/invoices
```

**Response `200 OK`**

```json
{
  "customer": {
    "_id": "674f1a2b3c4d5e6f7a8b9c0e",
    "name": "Aarav Sharma",
    "company": "Infosys Technologies",
    "createdAt": "2025-01-10T09:00:00.000Z",
    "updatedAt": "2025-01-10T09:00:00.000Z"
  },
  "invoices": [
    {
      "invoiceId": "INV-ABC123",
      "amount": 1500.00,
      "tax": 270.00,
      "total": 1770.00,
      "status": "paid",
      "issueDate": "2025-01-15T00:00:00.000Z",
      "dueDate": "2025-02-15T00:00:00.000Z"
    }
  ]
}
```

**Notes**
- The `invoices` array is always sorted by `issueDate` descending (newest first)
- Returns an empty `invoices` array `[]` if the customer has no invoices
- The customer field is the full customer object, not just an ID

**Error responses**

| Status | Body                              | Condition                 |
|--------|-----------------------------------|---------------------------|
| `404`  | `{ "error": "Customer not found" }` | Customer ID does not exist |
| `500`  | `{ "error": "..." }`              | Database error            |

---

## Analytics

### GET /api/analytics/summary

Returns a summary of all invoice data: total invoice count, total revenue, and a breakdown by status.

**Auth required:** No

**Example request**

```
GET /api/analytics/summary
```

**Response `200 OK`**

```json
{
  "totalInvoices": 47,
  "totalRevenue": 128450.75,
  "statusBreakdown": {
    "draft": {
      "count": 5,
      "amount": 8750.00
    },
    "pending": {
      "count": 12,
      "amount": 34200.50
    },
    "paid": {
      "count": 25,
      "amount": 76800.25
    },
    "overdue": {
      "count": 3,
      "amount": 5700.00
    },
    "cancelled": {
      "count": 2,
      "amount": 3000.00
    }
  }
}
```

| Field               | Type    | Description                                      |
|---------------------|---------|--------------------------------------------------|
| `totalInvoices`     | integer | Count of all invoices in the database            |
| `totalRevenue`      | number  | Sum of `total` (amount + tax) for all invoices   |
| `statusBreakdown`   | object  | Per-status count and total invoice amount         |

**Error responses**

| Status | Body                  | Condition          |
|--------|-----------------------|--------------------|
| `500`  | `{ "error": "..." }`  | Database error     |

---

### GET /api/analytics/top-customers

Returns the top customers ranked by total invoice volume (sum of invoice `total` values). Uses a single MongoDB aggregation pipeline with `$lookup` to join customer data.

**Auth required:** No

**Query parameters**

| Parameter | Type    | Default | Description              |
|-----------|---------|---------|--------------------------|
| `limit`   | integer | `5`     | Number of top customers to return (max 50) |

**Example request**

```
GET /api/analytics/top-customers?limit=3
```

**Response `200 OK`**

```json
{
  "customers": [
    {
      "_id": "674f1a2b3c4d5e6f7a8b9c0e",
      "name": "Sara Mukherjee",
      "company": "Dabur India",
      "totalAmount": 45600.00,
      "invoiceCount": 8
    },
    {
      "_id": "674f1a2b3c4d5e6f7a8b9c10",
      "name": "Aarav Sharma",
      "company": "Infosys Technologies",
      "totalAmount": 32100.50,
      "invoiceCount": 12
    }
  ]
}
```

| Field          | Type    | Description                                 |
|----------------|---------|---------------------------------------------|
| `_id`          | string  | Customer ObjectId                           |
| `name`         | string  | Customer name                               |
| `company`      | string  | Customer company                            |
| `totalAmount`  | number  | Sum of all invoice `total` values           |
| `invoiceCount` | integer | Number of invoices for this customer        |

**Notes**
- Sorted by `totalAmount` descending
- Customers with `totalAmount = 0` (no invoices) may appear if they exist in the customers collection — they will have `invoiceCount: 0`

**Error responses**

| Status | Body                  | Condition          |
|--------|-----------------------|--------------------|
| `500`  | `{ "error": "..." }`  | Database error     |

---

## Global Error Format

All error responses follow this structure:

```json
{
  "error": "Descriptive error message"
}
```

## Status Codes

| Status | Meaning                                          |
|--------|--------------------------------------------------|
| `200`  | Success                                          |
| `201`  | Resource created                                 |
| `400`  | Bad request — validation failure or malformed input |
| `404`  | Resource not found                               |
| `429`  | Too many requests — rate limit exceeded          |
| `500`  | Internal server error                            |

## Rate Limiting

All `/api` routes are rate-limited to **100 requests per 15 minutes** per IP address.

**Rate limit response (HTTP 429):**

```json
{
  "error": "Too many requests, please try again later."
}
```

## Request Size Limit

JSON request bodies are capped at **1 MB**. Bodies exceeding this limit receive a413 Payload Too Large response.

## Notes

- **Authentication**: Not yet implemented. All endpoints are publicly accessible. Before deploying to production, add JWT-based authentication middleware.
- **No soft deletes**: `DELETE` operations are permanent.
- **Cascading deletes**: Deleting a customer does not delete associated invoices; their `customerId` reference becomes orphaned (null when populated).
- **Invoice ID uniqueness**: `invoiceId` (e.g., `INV-A1B2C3D4`) is unique — duplicate generation is prevented via a unique index on `invoiceId`.