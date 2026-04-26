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

// 🔥 THE NEW TRUE-IDEMPOTENCY POST ROUTE
app.post("/expenses", (req, res) => {
  try {
    // 1. Extract and enforce the Idempotency-Key header
    // Note: Express automatically converts header keys to lowercase
    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
      return res
        .status(400)
        .json({ error: "Idempotency-Key header is required" });
    }

    // 2. Check if this request was already processed
    const existingExpense = db
      .prepare("SELECT * FROM expenses WHERE idempotency_key = ?")
      .get(idempotencyKey);

    if (existingExpense) {
      // Return the existing record instead of creating a duplicate
      return res.status(200).json({
        message: "Expense already processed",
        data: existingExpense,
      });
    }

    // 3. Extract data from the incoming request body
    const { amount, category, description, date } = req.body;

    // 4. Validate required fields and constraints
    if (amount === undefined || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }
    if (!category || !description) {
      return res
        .status(400)
        .json({ error: "Category and description are required" });
    }

    // 5. Generate internal fields & transform data
    // Storing currency as an integer (paise/cents) prevents floating-point math errors
    const amountInSmallestUnit = Math.round(amount * 100);
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    // 6. Insert into the database
    const insert = db.prepare(`
      INSERT INTO expenses (id, amount, category, description, date, created_at, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      amountInSmallestUnit,
      category,
      description,
      date,
      created_at,
      idempotencyKey,
    );

    // 7. Fetch the newly created record to return to the user
    const newExpense = db
      .prepare("SELECT * FROM expenses WHERE id = ?")
      .get(id);

    res.status(201).json({
      message: "Expense created successfully",
      data: newExpense,
    });
  } catch (error) {
    console.error("Error processing expense:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 📥 THE NEW GET ROUTE (Fetch, Filter, Sort)
app.get("/expenses", (req, res) => {
  try {
    // 1. Grab query parameters
    const { category, sort } = req.query;

    // 2. Base query and parameters array
    let sql = "SELECT * FROM expenses";
    const params = [];

    // 3. Apply category filter if provided
    if (category) {
      sql += " WHERE category = ?";
      params.push(category);
    }

    // 4. Apply sorting if requested
    if (sort === "date_desc") {
      sql += " ORDER BY date DESC";
    }

    // 5. Execute query and fetch all matching records
    const expenses = db.prepare(sql).all(...params);

    // 6. Return the JSON array of expenses
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
