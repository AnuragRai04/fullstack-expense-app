# 💸 Production-Grade Expense System

A full-stack expense tracking application built with a focus on data integrity, concurrency safety, and professional API standards.

## 🌐 Live Demo

- **Frontend:** [https://expense-frontend-z5ip.onrender.com](https://expense-frontend-z5ip.onrender.com)
- **API:** [https://expense-api-py0v.onrender.com](https://expense-api-py0v.onrender.com)

## 🚀 Technical Highlights

- **Atomic Idempotency:** Implements `INSERT OR IGNORE` logic to prevent race conditions and duplicate expenses during network retries.
- **Integer Money Storage:** Amounts are stored as integers (paise) to eliminate floating-point precision bugs common in JavaScript financials.
- **Zod Validation:** Strict schema-based request validation with structured, frontend-friendly error responses.
- **Currency Utility:** Centralized conversion and formatting using `Intl.NumberFormat` for consistent INR display.
- **DB Indexing:** Performance-optimized with indexes on `category` and `date` for $O(\log n)$ query speeds.
- **Pagination:** High-performance `GET /expenses` endpoint supporting `limit` and `offset` query parameters.
- **CORS-Restricted:** Backend security configured to only accept traffic from the verified production frontend.

## 🧠 Engineering Journal: Design & Trade-offs

### Key Design Decisions

- **SQLite + better-sqlite3:** Chosen for a zero-configuration developer experience. It provides a portable, single-file database that is perfect for demonstration and local auditing.
- **Atomic Concurrency:** Leveraged the database engine's `UNIQUE` constraint for thread-safe idempotency instead of expensive application-level locking.
- **Declarative Validation:** Used Zod to decouple validation logic from business controllers, ensuring the core logic only ever touches "clean" data.

### ⚖️ Trade-offs (Timebox Decisions)

- **Single-File Backend:** Logic is kept primarily in `server.js` to prioritize rapid iteration on core features like Zod and Pagination over complex folder nesting.
- **Local Persistence:** Prioritized a working SQLite setup over a cloud-hosted PostgreSQL to ensure the submission is self-contained and easily auditable.

### 🚫 Intentional Omissions

- **User Authentication:** Focused heavily on the "Hardening" of data intake and storage; Auth (JWT/OAuth) was deferred to keep the scope focused on API reliability.
- **Persistence on Render:** Render’s free tier uses an ephemeral filesystem. While the app is production-ready, data resets on server restart—a migration to a hosted DB (like Supabase) is the designated next step for scaling.

## 🛠️ Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js, Express, Zod
- **Database:** SQLite (better-sqlite3)
- **Hosting:** Render

## ⚙️ Run Locally

1. **Backend**

   ```bash
   cd mini-expense-system
   npm install
   node server.js

   ```

2. **Frontend**
   cd expense-frontend
   npm install
   npm run dev
