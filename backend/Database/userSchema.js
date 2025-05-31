const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: false },
  emailAddress: { type: String, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: false },
  companyName: { type: String, required: false },
  companyAddress: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    postalCode: { type: String, required: false },
    country: { type: String, required: false },
  },
  taxId: { type: String, required: false },
  businessType: { type: String, required: false }, // e.g., Manufacturer, Distributor, Retailer
  primaryContactName: { type: String, required: false },
  primaryContactPhone: { type: String, required: false },
  preferredShippingMethods: [{ type: String, required: false }], // e.g., ["Air", "Sea", "Land"]
  operatingRegions: [{ type: String, required: false }], // e.g., ["North America", "Europe"]
  annualShipmentVolume: { type: Number, required: false }, // Number of shipments per year
  averageShipmentWeight: { type: Number, required: false }, // Average weight in kg
  sustainabilityGoals: { type: String, required: false }, // e.g., "Reduce carbon emissions by 20% in 5 years"
  profilePhoto: { type: String, required: false }, // Signed URL for profile photo
  createdAt: { type: Date, default: Date.now },
});

const userModel = mongoose.model("userModel", userSchema);
module.exports = userModel;
