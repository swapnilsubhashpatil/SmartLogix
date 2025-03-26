const mongoose = require("mongoose");

async function connectMongoDB() {
  await mongoose
    .connect(
      "mongodb+srv://swapnil:1234@smartlogix.ci5ut23.mongodb.net/?retryWrites=true&w=majority&appName=SmartLogix"
    )
    .then(() => {
      console.log("MongoDB Database is Connected");
    })
    .catch((error) => {
      console.log("Error connecting the Database: ", error);
    });
}

module.exports = connectMongoDB;
