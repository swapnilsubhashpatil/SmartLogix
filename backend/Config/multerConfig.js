const fs = require("fs");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const vision = require("@google-cloud/vision");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

let credentials;

if (process.env.NODE_ENV === "production") {
  // Cloud Run: Load credentials from Secret Manager mount
  storageClient = new Storage(); // No credentials needed
  visionClient = new vision.ImageAnnotatorClient();
} else {
  // Local: Load service account from local JSON file
  const localKeyPath = path.resolve(__dirname, "./smartlogix-upload.json");
  credentials = JSON.parse(fs.readFileSync(localKeyPath, "utf8"));
}

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google Cloud clients
const storage = new Storage({ credentials });
const visionClient = new vision.ImageAnnotatorClient({ credentials });

module.exports = { upload, storage, visionClient };
