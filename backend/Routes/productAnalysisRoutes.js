const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { upload, storage, visionClient } = require("../Config/multerConfig");
const { verifyToken } = require("../Middleware/auth");
const ProductAnalysis = require("../Database/productAnalysisSchema");
const Draft = require("../Database/draftSchema");
const mongoose = require("mongoose");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Analyze Product
router.post(
  "/api/analyze-product",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const userId = req.user.id;
      const imageFile = req.file;
      const bucketName =
        process.env.GOOGLE_CLOUD_BUCKET_NAME || "your-bucket-name";
      if (!bucketName) {
        return res.status(500).json({ error: "Bucket name not configured" });
      }

      const fileName = `${Date.now()}_${imageFile.originalname}`;
      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(fileName);

      // Upload image to Google Cloud Storage
      console.log("Uploading to:", bucketName, fileName);
      await new Promise((resolve, reject) => {
        const stream = blob
          .createWriteStream({
            metadata: { contentType: imageFile.mimetype },
          })
          .on("error", reject)
          .on("finish", resolve);
        stream.end(imageFile.buffer);
      });

      // Generate a signed URL for the image (expires in 7 days)
      const [signedUrl] = await blob.getSignedUrl({
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      // Analyze with Vision API
      console.log("Analyzing with Vision API...");
      const [visionResult] = await visionClient.labelDetection({
        image: {
          source: {
            imageUri: `gs://${bucketName}/${fileName}`,
          },
        },
      });

      const labels = visionResult.labelAnnotations || [];
      const visionResponse = {
        success: true,
        labels: labels.map((label) => ({
          description: label.description,
          score: label.score,
        })),
      };

      // Prepare prompt for Gemini AI
      const prompt = `
Analyze the following Google Vision API response and provide:

1. The Hair Code for the product.
2. A detailed product description.
3. Whether the product is perishable (true/false).
4. Whether the product is hazardous (true/false).
5. A concise list of the essential documents required to export this product outside the country (only document names).
6. Additional tips and recommendations for successfully exporting this product outside the country, referencing world customs rules where applicable.

Return the result as a JSON object in this format:

{
  "HS Code": "string",
  "Product Description": "string",
  "Perishable": boolean,
  "Hazardous": boolean,
  "Required Export Document List": ["string", "string", ...],
  "Recommendations": {
    "message": "string",
    "additionalTip": "string"
  }
}

When determining the required export documents and providing recommendations, please reference world customs rules and regulations to ensure accuracy and compliance.

Vision API Response:
${JSON.stringify(visionResponse, null, 2)}
`;

      // Generate response with Gemini AI
      const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const geminiResult = await model.generateContent(prompt);
      const rawResponse = geminiResult.response.text();
      const jsonStart = rawResponse.indexOf("{");
      const jsonEnd = rawResponse.lastIndexOf("}") + 1;
      const cleanResponseText = rawResponse.slice(jsonStart, jsonEnd).trim();
      const geminiResponse = JSON.parse(cleanResponseText);

      // Save product analysis to MongoDB
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId format" });
      }
      const validatedUserId = new mongoose.Types.ObjectId(userId);

      const productAnalysis = await ProductAnalysis.create({
        userId: validatedUserId,
        imageDetails: {
          bucketName,
          fileName,
          mimeType: imageFile.mimetype,
        },
        visionResponse,
        geminiResponse,
        timestamp: new Date(),
      });

      // Create new draft with product analysis data
      const draft = await Draft.create({
        userId: validatedUserId,
        formData: {
          ShipmentDetails: {
            "HS Code": geminiResponse["HS Code"],
            "Product Description": geminiResponse["Product Description"],
          },
          TradeAndRegulatoryDetails: {
            Perishable: geminiResponse.Perishable,
            "Hazardous Material": geminiResponse.Hazardous,
          },
        },
        statuses: {
          compliance: "notDone",
          routeOptimization: "notDone",
        },
        timestamp: new Date(),
      });

      // Send response to frontend
      res.json({
        data: geminiResponse,
        imageUrl: signedUrl,
        recordId: productAnalysis._id,
        draftId: draft._id,
      });
    } catch (error) {
      console.error("Error in product analysis:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to analyze product",
      });
    }
  }
);

module.exports = router;
