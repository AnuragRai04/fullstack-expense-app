const Database = require("better-sqlite3");
const db = new Database("expenses.db");

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    amount INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL
  );
`);

// Performance indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  CREATE INDEX IF NOT EXISTS idx_expenses_date_desc ON expenses(date DESC);
`);

module.exports = db;
