const CurrencyUtil = {
  // Rupees (from frontend) → Paise (for DB storage)
  rupeesToPaise: (rupees) => {
    return Math.round(parseFloat(rupees) * 100);
  },

  // Paise (from DB) → Rupees float
  paiseToRupees: (paise) => {
    return paise / 100;
  },

  // Paise → formatted ₹ string (e.g. ₹1,250.50)
  formatINR: (paise) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(paise / 100);
  },
};

module.exports = CurrencyUtil;
