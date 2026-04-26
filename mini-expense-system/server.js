const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { z } = require("zod");
const db = require("./db");
const { rupeesToPaise } = require("./utils/currency");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Allow both local dev and deployed frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://expense-frontend-z5ip.onrender.com", // replace after Step 3
    ],
  }),
);
app.use(express.json());

// rest of your file is unchanged...

// ─────────────────────────────────────────
// ERROR HELPER
// ─────────────────────────────────────────
const sendError = (res, status, code, message, field = null) => {
  return res.status(status).json({
    error: {
      code,
      message,
      ...(field && { field }),
    },
  });
};

// ─────────────────────────────────────────
// ZOD SCHEMA
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
// VALIDATION MIDDLEWARE
// ─────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const issues = result.error.issues ?? result.error.errors ?? [];
    const first = issues[0];

    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      first?.message ?? "Invalid request body",
      first?.path?.[0] ?? null,
    );
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
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) {
      return sendError(
        res,
        400,
        "MISSING_HEADER",
        "Idempotency-Key header is required",
        "Idempotency-Key",
      );
    }

    const { amount, category, description, date } = req.body;

    // ✅ Currency utility handles rupees → paise
    const amountInSmallestUnit = rupeesToPaise(amount);
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
      category,
      description,
      date,
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
    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred",
    );
  }
});

app.get("/expenses", (req, res) => {
  try {
    let { category, sort, limit, offset } = req.query;

    limit = Math.min(parseInt(limit) || 100, 500);
    offset = Math.max(parseInt(offset) || 0, 0);

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

    sql += ` ${SORT_OPTIONS[sort] || "ORDER BY date DESC"}`;
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const expenses = db
      .prepare(sql)
      .all(...params)
      .map(({ idempotency_key, ...rest }) => rest);

    res.status(200).json({
      count: expenses.length,
      limit,
      offset,
      data: expenses,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return sendError(res, 500, "FETCH_ERROR", "Failed to retrieve expenses");
  }
});

// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  return sendError(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    "An unexpected error occurred",
  );
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
