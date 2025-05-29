const mongoose = require("mongoose");

const draftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    formData: {
      type: mongoose.Schema.Types.Mixed, // Schemaless for flexibility
      default: {},
    },
    complianceData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    routeData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    carbonAnalysisData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    productAnalysisData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { strict: false } // Allows additional fields for scalability
);

module.exports = mongoose.model("Draft", draftSchema);
