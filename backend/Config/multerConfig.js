const fs = require("fs");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const vision = require("@google-cloud/vision");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

let storage, visionClient;

if (process.env.NODE_ENV === "production") {
  // Load credentials from mounted secret in Cloud Run
  const keyPath = "/secrets/smartlogix-upload";
  const credentials = JSON.parse(fs.readFileSync(keyPath, "utf8"));

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
