const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.post("/expenses", (req, res) => {
  try {
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) {
      return res
        .status(400)
        .json({ error: "Idempotency-Key header is required" });
    }

    let { amount, category, description, date } = req.body;

    // Amount validation
    if (!Number.isFinite(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: "Amount must be a positive number" });
    }

    // Date validation
    if (!date || isNaN(Date.parse(date))) {
      return res
        .status(400)
        .json({ error: "Date must be a valid ISO date string" });
    }
    const normalizedDate = new Date(date).toISOString().split("T")[0];

    // Category and description presence check
    if (!category || !description) {
      return res
        .status(400)
        .json({ error: "Category and description are required" });
    }

    // Normalize and validate content
    const normalizedCategory = category.toLowerCase().trim();
    const normalizedDescription = description.trim();

    if (!normalizedCategory) {
      return res.status(400).json({ error: "Category cannot be blank" });
    }
    if (!normalizedDescription) {
      return res.status(400).json({ error: "Description cannot be blank" });
    }
    if (normalizedDescription.length > 500) {
      return res
        .status(400)
        .json({ error: "Description must be under 500 characters" });
    }

    // Safe transform after validation
    const amountInSmallestUnit = Math.round(amount * 100);
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    const insert = db.prepare(`
      INSERT OR IGNORE INTO expenses 
      (id, amount, category, description, date, created_at, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insert.run(
      id,
      amountInSmallestUnit,
      normalizedCategory,
      normalizedDescription,
      normalizedDate,
      created_at,
      idempotencyKey,
    );

    const expense = db
      .prepare("SELECT * FROM expenses WHERE idempotency_key = ?")
      .get(idempotencyKey);

    const { idempotency_key, ...cleanExpense } = expense;

    if (info.changes > 0) {
      return res.status(201).json({
        message: "Expense created successfully",
        data: cleanExpense,
      });
    } else {
      return res.status(200).json({
        message: "Expense already processed",
        data: cleanExpense,
      });
    }
  } catch (error) {
    console.error("Error processing expense:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/expenses", (req, res) => {
  try {
    const { category, sort } = req.query;

    let sql = "SELECT * FROM expenses";
    const params = [];

    if (category) {
      sql += " WHERE LOWER(category) = LOWER(?)";
      params.push(category);
    }

    const SORT_OPTIONS = {
      date_desc: "ORDER BY date DESC",
      date_asc: "ORDER BY date ASC",
      amount_desc: "ORDER BY amount DESC",
    };

    const sortClause = SORT_OPTIONS[sort] || "ORDER BY date DESC";
    sql += ` ${sortClause}`;

    const expenses = db
      .prepare(sql)
      .all(...params)
      .map(({ idempotency_key, ...rest }) => rest);

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
