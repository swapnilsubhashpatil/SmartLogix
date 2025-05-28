const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const vision = require("@google-cloud/vision");
const dotenv = require("dotenv");
dotenv.config();

const serviceAccountCredentials = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google Cloud clients with credentials
const storage = new Storage({ credentials: serviceAccountCredentials });
const visionClient = new vision.ImageAnnotatorClient({
  credentials: serviceAccountCredentials,
});

module.exports = { upload, storage, visionClient };
