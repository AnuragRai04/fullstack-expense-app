const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { z } = require("zod");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// ZOD SCHEMA
// amount: rupees from frontend (e.g. 450.50)
// max: ₹1,00,000 (1 lakh) — adjust if you meant 1 crore (1,00,00,000)
// ─────────────────────────────────────────
const expenseSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive({ message: "Amount must be greater than 0" })
    .max(100000, { message: "Amount cannot exceed ₹1,00,000" }),

  category: z.enum(["food", "travel", "utilities", "other"], {
    errorMap: () => ({
      message: "Category must be one of: food, travel, utilities, other",
    }),
  }),

  description: z
    .string({ invalid_type_error: "Description must be a string" })
    .trim()
    .min(1, { message: "Description cannot be blank" })
    .max(500, { message: "Description must be under 500 characters" }),

  date: z
    .string({ invalid_type_error: "Date must be a string" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Date must be a valid ISO date string",
    })
    .transform((val) => new Date(val).toISOString().split("T")[0]),
});

// ─────────────────────────────────────────
// REUSABLE VALIDATION MIDDLEWARE
// ─────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Zod v3: result.error.errors — Zod v4: result.error.issues
    const issues = result.error.issues ?? result.error.errors ?? [];

    const details = issues.map((e) => ({
      field: e.path[0] ?? "unknown",
      message: e.message,
    }));

    return res.status(400).json({
      error: "Validation failed",
      details,
    });
  }

  req.body = result.data;
  next();
};

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.post("/expenses", validate(expenseSchema), (req, res) => {
  try {
    // Idempotency check (unchanged)
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) {
      return res
        .status(400)
        .json({ error: "Idempotency-Key header is required" });
    }

    // req.body is already validated and normalized by middleware
    const { amount, category, description, date } = req.body;

    // Transform rupees → paise AFTER validation
    const amountInSmallestUnit = Math.round(amount * 100);
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    // Atomic insert (unchanged)
    const insert = db.prepare(`
      INSERT OR IGNORE INTO expenses 
      (id, amount, category, description, date, created_at, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insert.run(
      id,
      amountInSmallestUnit,
      category, // already lowercased by z.enum
      description, // already trimmed by z.string().trim()
      date, // already normalized to YYYY-MM-DD by .transform()
      created_at,
      idempotencyKey,
    );

    // Always fetch after insert (unchanged)
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
