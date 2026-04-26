const CurrencyUtil = {
  // Paise (from DB) → formatted ₹ string (e.g. ₹1,250.50)
  formatINR: (paise) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(paise / 100);
  },

  // Paise → plain rupees float (for math/totals)
  paiseToRupees: (paise) => {
    return paise / 100;
  },
};

export default CurrencyUtil;
