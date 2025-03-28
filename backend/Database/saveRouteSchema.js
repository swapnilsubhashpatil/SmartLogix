const mongoose = require("mongoose");

const saveRouteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  formData: {
    from: { type: String, required: true },
    to: { type: String, required: true },
    weight: { type: Number, required: true },
  },
  routeData: {
    type: Object, // Contains routeDirections, totalDistance, totalCarbonEmission, etc.
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SaveRoute", saveRouteSchema);
