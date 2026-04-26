const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "expenses.db");
const db = new Database(dbPath);

const initializeDB = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount INTEGER,
      category TEXT,
      description TEXT,
      date TEXT,
      created_at TEXT,
      idempotency_key TEXT UNIQUE
    )
  `;

  db.exec(createTableQuery);
  console.log("Database initialized and 'expenses' table is ready.");
};

initializeDB();

module.exports = db;
