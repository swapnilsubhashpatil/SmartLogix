const fs = require("fs");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const vision = require("@google-cloud/vision");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

let storage, visionClient;

if (process.env.NODE_ENV === "production") {
  let credentials;
  try {
    credentials = JSON.parse(process.env.ENV); // Parse the JSON string from the ENV variable
  } catch (error) {
    console.error("Failed to parse credentials from ENV:", error);
    throw new Error(
      "Unable to load Google Cloud credentials from environment variable"
    );
  }

  storage = new Storage({ credentials });
  visionClient = new vision.ImageAnnotatorClient({ credentials });
} else {
  // Local development: load from JSON file
  const localPath = path.resolve(__dirname, "./smartlogix-upload.json");
  const credentials = JSON.parse(fs.readFileSync(localPath, "utf8"));

  storage = new Storage({ credentials });
  visionClient = new vision.ImageAnnotatorClient({ credentials });
}

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

module.exports = { upload, storage, visionClient };
