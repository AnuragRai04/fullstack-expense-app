# Full-Stack Expense Tracker

A production-grade expense tracking system built with React + Node.js/Express + SQLite.

## Live Demo

- **Frontend:** https://expense-frontend-z5ip.onrender.com
- **API:** https://expense-api-py0v.onrender.com

## Technical Highlights

- **Atomic idempotency** — `INSERT OR IGNORE` prevents duplicate expenses on retry
- **Integer money storage** — amounts stored in paise to avoid floating-point bugs
- **Zod validation** — schema-based request validation with structured error responses
- **Currency utility** — centralized rupee/paise conversion using `Intl.NumberFormat`
- **DB indexing** — indexes on `category` and `date` for query performance
- **Pagination** — GET /expenses supports `limit` and `offset`
- **CORS-restricted** — backend only accepts requests from the deployed frontend

## API Reference

### POST /expenses

\`\`\`
Headers:
Content-Type: application/json
Idempotency-Key: <uuid>

Body:
{ amount: number, category: "food"|"travel"|"utilities"|"other",
description: string, date: "YYYY-MM-DD" }

Returns 201 on create, 200 if already processed
\`\`\`

### GET /expenses

\`\`\`
Query params:
?category=food
?sort=date_desc|date_asc|amount_desc
?limit=100&offset=0
\`\`\`

## Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **Validation:** Zod
- **Hosting:** Render

## Run Locally

\`\`\`bash

# Backend

cd mini-expense-system
npm install
node server.js

# Frontend

cd expense-frontend
npm install
npm run dev
\`\`\`
