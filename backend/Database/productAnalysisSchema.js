const mongoose = require("mongoose");

const productAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  imageDetails: {
    bucketName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  visionResponse: {
    success: { type: Boolean, required: true },
    labels: [
      {
        description: { type: String, required: true },
        score: { type: Number, required: true },
      },
    ],
  },
  geminiResponse: {
    "HS Code": { type: String, required: true },
    "Product Description": { type: String, required: true },
    Perishable: { type: Boolean, required: true },
    Hazardous: { type: Boolean, required: true },
    "Required Export Document List": [{ type: String }],
    Recommendations: {
      message: { type: String, required: true },
      additionalTip: { type: String, required: true },
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ProductAnalysis", productAnalysisSchema);
