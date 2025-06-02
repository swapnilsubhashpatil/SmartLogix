const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { verifyToken } = require("../Middleware/auth");
const Draft = require("../Database/draftSchema");
const { GoogleGenerativeAI } = require("@google/generative-ai");
// Choose Route (creates new draft or updates existing)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const countryOptions = [
  { label: "United States", value: "US" },
  { label: "Canada", value: "CA" },
  { label: "Mexico", value: "MX" },
  { label: "United Kingdom", value: "GB" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Australia", value: "AU" },
  { label: "India", value: "IN" },
  { label: "China", value: "CN" },
  { label: "Japan", value: "JP" },
  { label: "Brazil", value: "BR" },
  { label: "South Africa", value: "ZA" },
  { label: "Nigeria", value: "NG" },
  { label: "Egypt", value: "EG" },
  { label: "Argentina", value: "AR" },
  { label: "Italy", value: "IT" },
  { label: "Spain", value: "ES" },
  { label: "Netherlands", value: "NL" },
  { label: "Sweden", value: "SE" },
  { label: "Norway", value: "NO" },
  { label: "Denmark", value: "DK" },
  { label: "Finland", value: "FI" },
  { label: "Switzerland", value: "CH" },
  { label: "Belgium", value: "BE" },
  { label: "Austria", value: "AT" },
  { label: "Poland", value: "PL" },
  { label: "Turkey", value: "TR" },
  { label: "Saudi Arabia", value: "SA" },
  { label: "United Arab Emirates", value: "AE" },
  { label: "Singapore", value: "SG" },
  { label: "South Korea", value: "KR" },
  { label: "New Zealand", value: "NZ" },
  // Add more countries as needed to cover expected inputs
];

// Helper function to normalize place name to country code using Gemini AI
const normalizeCountry = async (placeName) => {
  if (!placeName) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
You are a precise and structured AI.

Given the place name "${placeName}", return ONLY the following information as a **valid JSON object**:
{
  "countryName": "Full country name (e.g., 'United States')",
  "countryCode": "ISO 3166-1 alpha-2 code (e.g., 'US')",
  "confidence": Confidence score between 0 and 1 (e.g., 0.95)
}

Instructions:
- If the input is ambiguous or not a valid location, return:
  {
    "countryName": null,
    "countryCode": null,
    "confidence": 0
  }

STRICTLY RETURN ONLY JSON with no explanations, headings, or extra text.
`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Sanitize: Remove markdown-style code block if present
    if (responseText.startsWith("```")) {
      responseText = responseText
        .replace(/```(?:json)?/gi, "")
        .replace(/```$/, "")
        .trim();
    }

    // Parse the cleaned response
    let aiResult;
    try {
      aiResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        `Failed to parse Gemini response for ${placeName}:`,
        parseError
      );
      return null;
    }

    // Validate against countryOptions
    if (aiResult && aiResult.countryCode) {
      const option = countryOptions.find(
        (opt) => opt.value.toLowerCase() === aiResult.countryCode.toLowerCase()
      );
      if (option) {
        return {
          countryName: option.label,
          countryCode: option.value,
          confidence: aiResult.confidence || 0.9,
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Gemini AI error for ${placeName}:`, error);
    return null;
  }
};

router.post("/api/choose-route", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { draftId, routeData, formData } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }
    const validatedUserId = new mongoose.Types.ObjectId(userId);

    let draft;
    if (draftId) {
      // Update existing draft
      if (!mongoose.Types.ObjectId.isValid(draftId)) {
        return res.status(400).json({ error: "Invalid draftId format" });
      }
      draft = await Draft.findOne({ _id: draftId, userId });
      if (!draft) {
        return res
          .status(404)
          .json({ message: "Draft not found or not authorized" });
      }
      draft.routeData = routeData;
      draft.statuses.routeOptimization = "done";
      draft.markModified("statuses");
      await draft.save();
      // console.log("Updated draft:", draft);
      res.status(200).json({
        message: "Draft updated successfully",
        recordId: draft._id,
      });
    } else {
      // Create new draft
      if (!formData || !formData.from || !formData.to || !formData.weight) {
        return res.status(400).json({
          error: "formData must include from, to, and weight for new draft",
        });
      }
      const validatedWeight = Number(formData.weight);
      if (isNaN(validatedWeight)) {
        return res.status(400).json({ error: "Weight must be a valid number" });
      }

      // Normalize from and to using Gemini AI
      const originResult = await normalizeCountry(formData.from);
      const destinationResult = await normalizeCountry(formData.to);

      // Validate results
      if (!originResult || !destinationResult) {
        return res.status(400).json({
          error: `Could not determine country for ${
            !originResult ? formData.from : formData.to
          }`,
        });
      }

      // Prepare JSON outputs for response
      const originJson = {
        input: formData.from,
        countryName: originResult.countryName,
        countryCode: originResult.countryCode,
        confidence: originResult.confidence,
      };
      const destinationJson = {
        input: formData.to,
        countryName: destinationResult.countryName,
        countryCode: destinationResult.countryCode,
        confidence: destinationResult.confidence,
      };

      // Create draft with normalized country codes
      draft = await Draft.create({
        userId: validatedUserId,
        formData: {
          ShipmentDetails: {
            "Origin Country": originResult.countryCode, // e.g., "US"
            "Destination Country": destinationResult.countryCode, // e.g., "CA"
            "Gross Weight": validatedWeight,
          },
        },
        routeData,
        statuses: {
          compliance: "notDone",
          routeOptimization: "done",
        },
        timestamp: new Date(),
      });
      // console.log("Created draft:", draft);

      // Return response with JSON outputs
      res.status(200).json({
        message: "Route chosen and draft saved successfully",
        recordId: draft._id,
        originAnalysis: originJson,
        destinationAnalysis: destinationJson,
      });
    }
  } catch (error) {
    console.error("Error choosing route:", error.stack);
    res.status(500).json({
      error: "Failed to choose route",
      details: error.message,
    });
  }
});

module.exports = router;
