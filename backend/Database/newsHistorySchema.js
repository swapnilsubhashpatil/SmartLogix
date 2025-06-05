const mongoose = require("mongoose");

const newsHistorySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    index: true, // Index for faster queries by date
  },
  query: {
    type: String,
    required: true,
    default: "default",
  },
  articles: [
    {
      title: { type: String, default: "No title available" },
      link: { type: String, default: "#" },
      summary: { type: String, default: "No summary available" },
      date: { type: String, default: new Date().toISOString() },
      source: { type: String, default: "Unknown" },
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient querying
newsHistorySchema.index({ date: 1, query: 1 });

module.exports = mongoose.model("NewsHistory", newsHistorySchema);
