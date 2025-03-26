const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: false },
  emailAddress: { type: String, required: true },
  password: { type: String, required: true },
});

const userModel = mongoose.model("userModel", userSchema);
module.exports = userModel;
