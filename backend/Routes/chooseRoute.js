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

    // Validate routeData
    if (
      !routeData ||
      !routeData.routeDirections ||
      !Array.isArray(routeData.routeDirections)
    ) {
      return res
        .status(400)
        .json({ error: "routeData must include routeDirections as an array" });
    }
    if (!routeData.distanceByLeg || !Array.isArray(routeData.distanceByLeg)) {
      return res.status(400).json({ error: "distanceByLeg must be an array" });
    }
    if (routeData.distanceByLeg.length !== routeData.routeDirections.length) {
      return res
        .status(400)
        .json({
          error:
            "distanceByLeg length must match the number of routeDirections",
        });
    }
    for (let i = 0; i < routeData.distanceByLeg.length; i++) {
      const distance = routeData.distanceByLeg[i];
      if (isNaN(distance) || distance <= 0) {
        return res
          .status(400)
          .json({ error: `distanceByLeg[${i}] must be a positive number` });
      }
    }

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
      draft.routeData = {
        ...routeData,
        distanceByLeg: routeData.distanceByLeg, // Explicitly ensure distanceByLeg is saved
      };
      draft.statuses.routeOptimization = "done";
      draft.markModified("statuses");
      draft.markModified("routeData");
      await draft.save();
      res.status(200).json({
        message: "Draft updated successfully",
        recordId: draft._id,
      });
    } else {
      // Create new draft
      if (
        !formData ||
        !formData.from ||
        !formData.to ||
        !formData.package ||
        !formData.package.weight
      ) {
        return res.status(400).json({
          error:
            "formData must include from, to, and package with weight for new draft",
        });
      }

      const validatedWeight = Number(formData.package.weight);
      if (isNaN(validatedWeight) || validatedWeight <= 0) {
        return res
          .status(400)
          .json({ error: "Weight must be a valid positive number" });
      }

      // Normalize from and to using Gemini AI
      let originResult, destinationResult;
      try {
        originResult = await normalizeCountry(formData.from);
        destinationResult = await normalizeCountry(formData.to);
      } catch (normalizeError) {
        console.error("Error normalizing countries:", normalizeError);
        return res.status(500).json({
          error: "Failed to normalize countries",
          details: normalizeError.message,
        });
      }

      // Validate results
      if (
        !originResult ||
        !originResult.countryCode ||
        !originResult.countryName
      ) {
        return res.status(400).json({
          error: `Could not determine country for ${formData.from}`,
        });
      }
      if (
        !destinationResult ||
        !destinationResult.countryCode ||
        !destinationResult.countryName
      ) {
        return res.status(400).json({
          error: `Could not determine country for ${formData.to}`,
        });
      }

      // Prepare JSON outputs for response
      const originJson = {
        input: formData.from,
        countryName: originResult.countryName,
        countryCode: originResult.countryCode,
        confidence: originResult.confidence || "N/A",
      };
      const destinationJson = {
        input: formData.to,
        countryName: destinationResult.countryName,
        countryCode: destinationResult.countryCode,
        confidence: destinationResult.confidence || "N/A",
      };

      // Create draft with normalized country codes and routeData including distanceByLeg
      try {
        draft = await Draft.create({
          userId: validatedUserId,
          formData: {
            ShipmentDetails: {
              "Origin Country": originResult.countryCode,
              "Destination Country": destinationResult.countryCode,
              "Gross Weight": validatedWeight,
            },
          },
          routeData: {
            ...routeData,
            distanceByLeg: routeData.distanceByLeg, // Explicitly ensure distanceByLeg is saved
          },
          statuses: {
            compliance: "notDone",
            routeOptimization: "done",
          },
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      } catch (draftError) {
        console.error("Error creating draft:", draftError);
        return res.status(500).json({
          error: "Failed to create draft",
          details: draftError.message,
        });
      }

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
