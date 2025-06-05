const mongoose = require("mongoose");

async function connectMongoDB() {
  await mongoose
    .connect(
      "mongodb+srv://workforswapnilpatil:1d30VrxinvZFoHvy@smartlogix.tmv2e33.mongodb.net/"
    )
    .then(() => {
      console.log("MongoDB Database is Connected");
    })
    .catch((error) => {
      console.log("Error connecting the Database: ", error);
    });
}

module.exports = connectMongoDB;
