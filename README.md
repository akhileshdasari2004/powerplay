# Invoice Dashboard

> Full-stack MERN application for invoice management

Invoice Dashboard is a modern web application that allows businesses to manage invoices, track customers, and monitor revenue analytics through an intuitive UI backed by a RESTful API.

## Features

- **Invoice Management** — Create, read, update, and delete invoices with automatic tax and total calculation
- **Customer Management** — Manage customer records with company associations
- **Analytics Dashboard** — Real-time summary statistics and top-customer rankings
- **Filtering & Pagination** — Filter invoices by status, customer, and date ranges; paginated lists throughout
- **Search** — Search customers by name or company with prefix matching
- **Aggregation Pipelines** — Efficient MongoDB aggregation for analytics with O(1) database round-trips
- **Security Hardening** — Helmet headers, CORS whitelist, rate limiting, and payload size limits
- **Health Check Endpoint** — `/health` for monitoring database connectivity and uptime

## Architecture

```
┌─────────────────┐          ┌─────────────────┐
│   React 18      │  HTTP    │  Express 4      │
│   Vite 5        │─────────▶│  REST API       │
│                 │  JSON    │                 │
│  React Router   │◀─────────│  Mongoose ODM   │
│  React Hook Form│          │                 │
│  Zod Validation │          └────────┬────────┘
└─────────────────┘                   │
                                       │
                              ┌────────▼────────┐
                              │   MongoDB       │
                              │   (Atlas-ready) │
                              └─────────────────┘
```

**Request Flow**
1. Client sends JSON requests to `POST /api/invoices`, `GET /api/customers`, etc.
2. Express router delegates to controller functions
3. Controllers call service-layer classes that run Mongoose queries
4. Aggregations and `$lookup` joins fetch related data in a single database round-trip
5. Response JSON is returned to the client

**Key Design Decisions**
- **Service layer** — Business logic is isolated in service classes, keeping controllers thin
- **Aggregation with `$lookup`** — Related customer data is joined on invoices in a single query, avoiding N+1
- **No auth** — This version ships without authentication (auth layer can be added via JWT middleware)
- **Seed data** — `scripts/runSeed.js` ingests `seed-data.json` for local development

## Tech Stack

| Layer       | Technology                                              |
|-------------|---------------------------------------------------------|
| Frontend    | React 18, Vite 5, React Router 6, React Hook Form, Zod |
| Backend     | Node.js, Express 4, ES Modules                         |
| Database    | MongoDB 7+, Mongoose 8                                 |
| Security    | Helmet 8, cors, express-rate-limit                     |
| Validation  | Mongoose schema validators, Zod (frontend)             |
| Testing     | Vitest, Testing Library (frontend)                     |
| Utilities   | uuid (invoice ID generation)                           |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)

### Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and fill in MONGODB_URI

# Start development server
npm run dev

# Seed the database (optional — also runs automatically on first startup if DB is empty)
npm run seed
```

The seed imports customers and invoices from `seed-data.json` at the project root (~2,000 records). Analytics are computed from invoice data. Demo users are created automatically:

| Role  | Email           | Password   |
|-------|-----------------|------------|
| Admin | admin@test.com  | Admin@123  |
| User  | user@test.com   | User@123   |

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env if your backend runs on a different port

# Start development server
npm run dev
```

The frontend dev server runs on `http://localhost:5173` by default and proxies `/api` requests to the backend on port `5000`.

### Verify

```bash
# Health check
curl http://localhost:5000/health
# → { "status": "ok", "database": "connected", "uptime": "120s" }
```

## Environment Variables

### Backend (`backend/.env`)

| Variable             | Required | Default                    | Description                                      |
|----------------------|----------|----------------------------|--------------------------------------------------|
| `MONGODB_URI`        | Yes      | —                          | Full connection string including credentials     |
| `PORT`               | No       | `5000`                     | HTTP port                                        |
| `NODE_ENV`           | No       | `development`              | `development` or `production`                    |
| `CORS_ORIGIN`        | No       | `http://localhost:5173`    | Comma-separated allowed origins                  |

> **Security**: `MONGODB_URI` must contain username and password and start with `mongodb://` or `mongodb+srv://`.

### Frontend (`frontend/.env`)

| Variable       | Default                    | Description                           |
|----------------|----------------------------|---------------------------------------|
| `VITE_API_URL` | `http://localhost:5000/api` | Base URL for all API requests         |

## API Documentation

### Authentication

> **Note:** Authentication is not yet implemented. All endpoints are currently publicly accessible. JWT-based auth middleware should be added before exposing this API in production.

| Method | Endpoint            | Auth Required | Description                |
|--------|---------------------|---------------|----------------------------|
| POST   | `/api/auth/register`| No            | Register a new user        |
| POST   | `/api/auth/login`   | No            | Login and get tokens       |
| POST   | `/api/auth/logout`  | Yes           | Invalidate refresh token   |
| POST   | `/api/auth/refresh` | No            | Refresh access token       |
| GET    | `/api/auth/me`      | Yes           | Get current user profile   |

### Invoices

| Method | Endpoint              | Auth Required | Description                    |
|--------|-----------------------|---------------|--------------------------------|
| GET    | `/api/invoices`       | No            | List invoices (paginated)      |
| GET    | `/api/invoices/:id`   | No            | Get single invoice by ID       |
| POST   | `/api/invoices`       | No            | Create a new invoice           |
| PUT    | `/api/invoices/:id`   | No            | Update an existing invoice     |
| DELETE | `/api/invoices/:id`   | No            | Delete an invoice              |

### Customers

| Method | Endpoint                         | Auth Required | Description                      |
|--------|----------------------------------|---------------|----------------------------------|
| GET    | `/api/customers`                 | No            | List customers (paginated)       |
| GET    | `/api/customers/:id`             | No            | Get single customer by ID        |
| POST   | `/api/customers`                 | No            | Create a new customer            |
| PUT    | `/api/customers/:id`             | No            | Update an existing customer      |
| DELETE | `/api/customers/:id`             | No            | Delete a customer                |
| GET    | `/api/customers/:id/invoices`    | No            | Get customer with their invoices |

### Analytics

| Method | Endpoint                    | Auth Required | Description                           |
|--------|-----------------------------|---------------|---------------------------------------|
| GET    | `/api/analytics/summary`    | No            | Revenue and invoice count summary     |
| GET    | `/api/analytics/top-customers` | No         | Top customers by total invoice amount |

## Testing

### Frontend

```bash
cd frontend

# Run tests with watcher
npm run test

# Run tests with UI browser
npm run test:ui

# Generate coverage report
npm run coverage

# Lint
npm run lint
```

Tests use **Vitest** with **React Testing Library**. Write tests alongside components using the `.test.jsx` extension.

Example test file:

```jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/invoice/i)).toBeDefined();
  });
});
```

## Deployment

### Backend (Railway / Render / Fly.io)

1. Push code to GitHub
2. Connect repository to hosting provider
3. Set environment variables (`MONGODB_URI`, `PORT`, `NODE_ENV=production`, `CORS_ORIGIN`)
4. Deploy — the `start` script runs `node server.js`

> For production `CORS_ORIGIN`, set to your frontend domain only (e.g., `https://your-app.railway.app`)

### Frontend (Vercel / Netlify)

1. Set `VITE_API_URL` to your production backend URL (e.g., `https://api.your-app.railway.app/api`)
2. Build: `npm run build` outputs to `dist/`
3. Configure the host to serve `dist/index.html` for all routes (React Router client-side routing)

### Docker (Optional)

```dockerfile
# Backend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ .
EXPOSE 5000
CMD ["node", "server.js"]
```

## Security

| Concern            | Mitigation                                                 |
|--------------------|------------------------------------------------------------|
| XSS                | Helmet sets `X-Content-Type-Options`, `X-Frame-Options`    |
| CSRF               | CORS whitelist limits cross-origin requests                |
| DoS                | Rate-limited to 100 requests per 15 minutes per IP         |
| Payload abuse      | JSON body limited to 1 MB                                  |
| DB connection      | Credentials validated at startup; URI masked in logs       |
| No auth            | All endpoints are currently open — add JWT middleware      |

**Before production:**
- Add JWT authentication middleware to all `/api` routes
- Set `NODE_ENV=production`
- Restrict `CORS_ORIGIN` to your frontend domain only
- Enable Atlas IP whitelist or VPC peering
- Rotate database credentials regularly

## License

MIT