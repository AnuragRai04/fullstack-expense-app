# 💸 Mini Expense System

A production-grade full-stack expense tracking application built with React, Node.js, Express, and SQLite.

## ✨ Features

- **True Idempotency:** Backend prevents duplicate submissions using generated `Idempotency-Key` headers.
- **Financial Math Safety:** Currency is converted and stored as integers (paise/cents) to prevent floating-point errors.
- **Real-time Filtering & Sorting:** Backend-driven API routes for fast data retrieval.
- **Responsive UI:** Built with Vite and React, featuring immediate loading states and graceful error handling.

## 🛠️ Tech Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **Database:** SQLite (via `better-sqlite3`)

## 🚀 How to Run Locally

### 1. Start the Backend

\`\`\`bash
cd mini-expense-system
npm install
node server.js
\`\`\`
_(Runs on http://localhost:3000)_

### 2. Start the Frontend

Open a new terminal window:
\`\`\`bash
cd expense-frontend
npm install
npm run dev
\`\`\`
_(Runs on http://localhost:5173)_
