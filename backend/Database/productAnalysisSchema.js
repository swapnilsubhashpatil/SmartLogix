const mongoose = require("mongoose");

const productAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  imageDetails: {
    bucketName: String,
    fileName: String,
    mimeType: String,
    signedUrl: String, // Add this field
  },
  visionResponse: Object,
  geminiResponse: Object,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ProductAnalysis", productAnalysisSchema);
