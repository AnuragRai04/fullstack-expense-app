import { useState, useEffect } from "react";
import CurrencyUtil from "./utils/currency";

// ✅ Switches automatically between local and production
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://your-backend-url.onrender.com"; // replace after Step 3

function App() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchExpenses = async () => {
    setIsFetching(true);
    try {
      // ✅ Uses API_BASE_URL
      let url = `${API_BASE_URL}/expenses?sort=date_desc`;
      if (filterCategory) {
        url += `&category=${filterCategory}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      setExpenses(data.data ?? data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      setStatusMessage({
        text: "❌ Failed to load expenses from server.",
        type: "error",
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage({ text: "", type: "" });

    const idempotencyKey =
      window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    try {
      // ✅ Uses API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          amount: Number(amount),
          category,
          description,
          date,
        }),
      });

      const result = await response.json();

      if (response.status === 201) {
        setStatusMessage({
          text: "🚀 Expense added successfully!",
          type: "success",
        });
        setAmount("");
        setDescription("");
        setDate("");
        fetchExpenses();
      } else if (response.status === 200) {
        setStatusMessage({ text: "✅ " + result.message, type: "success" });
      } else {
        const errMsg = result.error?.message ?? result.error ?? "Unknown error";
        setStatusMessage({ text: "❌ " + errMsg, type: "error" });
      }
    } catch (error) {
      setStatusMessage({
        text: "❌ Network Error: Failed to connect to server.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalInPaise = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        fontFamily: "system-ui, sans-serif",
        color: "#e0e0e0",
        background: "#1e1e1e",
        padding: "20px",
        borderRadius: "10px",
      }}
    >
      <h1
        style={{
          borderBottom: "2px solid #333",
          paddingBottom: "10px",
          textAlign: "center",
        }}
      >
        Mini Expense System
      </h1>

      <div
        style={{
          background: "#252526",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          border: "1px solid #333",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Add New Expense</h3>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          <input
            type="number"
            step="0.01"
            placeholder="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={inputStyle}
            disabled={isSubmitting}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
            disabled={isSubmitting}
          >
            <option value="food">Food</option>
            <option value="travel">Travel</option>
            <option value="utilities">Utilities</option>
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={inputStyle}
            disabled={isSubmitting}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={inputStyle}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              gridColumn: "span 2",
              padding: "12px",
              background: isSubmitting ? "#0b5ed780" : "#0d6efd",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontWeight: "bold",
              transition: "background 0.2s",
            }}
          >
            {isSubmitting ? "Saving..." : "Save Expense"}
          </button>
        </form>
        {statusMessage.text && (
          <p
            style={{
              marginTop: "15px",
              fontWeight: "bold",
              color: statusMessage.type === "error" ? "#ff6b6b" : "#51cf66",
            }}
          >
            {statusMessage.text}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          padding: "0 10px",
        }}
      >
        <div>
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>
            Filter by Category:
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
            }}
          >
            <option value="">All Categories</option>
            <option value="food">Food</option>
            <option value="travel">Travel</option>
            <option value="utilities">Utilities</option>
            <option value="other">Other</option>
          </select>
        </div>
        <h2 style={{ margin: 0, color: "#51cf66" }}>
          Total: {CurrencyUtil.formatINR(totalInPaise)}
        </h2>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          background: "#252526",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #333" }}>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {isFetching ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                Loading...
              </td>
            </tr>
          ) : expenses.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                No expenses found.
              </td>
            </tr>
          ) : (
            expenses.map((exp) => (
              <tr key={exp.id} style={{ borderBottom: "1px solid #333" }}>
                <td style={tdStyle}>{exp.date}</td>
                <td style={tdStyle}>{exp.category}</td>
                <td style={tdStyle}>{exp.description}</td>
                <td style={tdStyle}>{CurrencyUtil.formatINR(exp.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const inputStyle = {
  padding: "10px",
  borderRadius: "4px",
  border: "1px solid #444",
  background: "#333",
  color: "#fff",
};
const thStyle = { padding: "15px", color: "#aaa" };
const tdStyle = { padding: "15px" };

export default App;
