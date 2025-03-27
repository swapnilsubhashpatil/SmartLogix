const mongoose = require("mongoose");

const complianceRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  formData: {
    type: Object,
    required: true,
  },
  complianceResponse: {
    type: Object,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("ComplianceRecord", complianceRecordSchema);
