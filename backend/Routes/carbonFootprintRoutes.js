const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const { verifyToken } = require("../Middleware/auth");
const Draft = require("../Database/draftSchema");
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Carbon Footprint Analysis (POST)
router.post("/api/carbon-footprint", verifyToken, async (req, res) => {
  try {
    const { origin, destination, distance, weight, routeDirections, draftId } =
      req.body;
    const userId = req.user.id; // Get userId from JWT token

    if (!origin || !destination || !distance || !weight || !routeDirections) {
      return res
        .status(400)
        .json({ error: "Missing required fields parameters" });
    }

    // Generate carbon footprint analysis
    const prompt = `
      You are a carbon footprint analysis AI for Movex. Based on the following inputs, provide a structured JSON response for a genuine carbon footprint analysis as of April 30, 2025. Use real-world CO2e emission factors: Land (0.07 kg/km), Sea (0.20 kg/km), Air (0.36 kg/km).

      Inputs:
      - Origin: ${origin}
      - Destination: ${destination}
      - Total Distance: ${distance} km
      - Weight: ${weight} kg
      - Route Directions: ${JSON.stringify(routeDirections)}

      Calculate emissions based on the transport mode ("state") in each routeDirections segment (land, sea, air). Distribute the total distance proportionally across segments if multiple exist.

      Response Format:
      {
        "totalDistance": "Total distance in km (e.g., '6700 km')",
        "totalEmissions": "Total CO2e emissions in kg (e.g., '1500 kg CO2e')",
        "routeAnalysis": [
          {
            "leg": "Leg number (e.g., 'Leg 1')",
            "origin": "Start waypoint",
            "destination": "End waypoint",
            "mode": "Transport mode (land, sea, air)",
            "distance": "Distance for this leg in km (e.g., '2000 km')",
            "emissions": "CO2e emissions in kg for this leg (e.g., '140 kg CO2e')"
          }
        ],
        "suggestions": [
          "Suggestion 1 for reducing emissions",
          "Suggestion 2 for alternative modes"
        ],
        "earthImpact": "A short description of the environmental impact (e.g., 'Equivalent to X trees absorbing CO2e for a year')"
      }
    `;

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    const jsonMatch = rawResponse.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }
    const responseData = JSON.parse(jsonMatch[0]);

    let draft;
    if (draftId) {
      // Validate draftId and userId
      if (!mongoose.Types.ObjectId.isValid(draftId)) {
        return res.status(400).json({ error: "Invalid draftId format" });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId format" });
      }

      // Update existing draft with carbon analysis using findOneAndUpdate
      draft = await Draft.findOneAndUpdate(
        { _id: draftId, userId }, // Ensure the draft belongs to the authenticated user
        { $set: { carbonAnalysis: responseData } }, // Update carbonAnalysis field
        { new: true, runValidators: true }
      );

      if (!draft) {
        return res
          .status(404)
          .json({ error: "Draft not found or not authorized" });
      }

      //   console.log("Updated draft with carbonAnalysis:", draft);
      // } else {
      // Create temporary draft
      draft = new Draft({
        userId: req.user.id,
        formData: {
          ShipmentDetails: {
            "Origin Country": { value: origin, label: origin },
            "Destination Country": { value: destination, label: destination },
            Weight: weight,
          },
        },
        statuses: {
          compliance: "Not applicable",
          routeOptimization: "Not applicable",
        },
        carbonAnalysis: responseData,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });
      await draft.save();
      // console.log("Created temporary draft:", draft);
    }

    res.status(200).json({
      ...responseData,
      draftId: draft._id.toString(), // Return draft ID for navigation
    });
  } catch (error) {
    console.error("Error in carbon footprint endpoint:", error);
    res.status(500).json({
      error: "Failed to generate carbon footprint analysis",
      details: error.message,
    });
  }
});

// Retrieve Carbon Footprint Analysis (GET)
router.get("/api/carbon-footprint/:draftId", verifyToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }
    if (!draft.carbonAnalysis) {
      return res
        .status(404)
        .json({ error: "No carbon analysis found for this draft" });
    }
    res.status(200).json(draft.carbonAnalysis);
  } catch (error) {
    console.error("Error retrieving carbon footprint:", error);
    res.status(500).json({
      error: "Failed to retrieve carbon footprint",
      details: error.message,
    });
  }
});

module.exports = router;
