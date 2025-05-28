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
    status: {
      complianceStatus: {
        type: String,
        enum: ["not_done", "ready", "not_ready"],
        default: "not_done",
      },
      routeOptimizationStatus: {
        type: String,
        enum: ["done", "not_done"],
        default: "not_done",
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { strict: false } // Allows additional fields for scalability
);

module.exports = mongoose.model("Draft", draftSchema);
