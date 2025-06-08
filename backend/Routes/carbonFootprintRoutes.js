const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const mongoose = require("mongoose");
const { verifyToken } = require("../Middleware/auth");
const Draft = require("../Database/draftSchema");

require("dotenv").config();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CARBON_INTERFACE_API_KEY = process.env.CARBON_INTERFACE_API_KEY;

router.post("/api/carbon-footprint", verifyToken, async (req, res) => {
  try {
    const {
      origin,
      destination,
      distance,
      weight,
      routeDirections,
      distanceByLeg,
      draftId,
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (
      !origin ||
      !destination ||
      !distance ||
      !weight ||
      !routeDirections ||
      !distanceByLeg
    ) {
      return res.status(400).json({
        error:
          "Missing required fields parameters: origin, destination, distance, weight, routeDirections, and distanceByLeg are all required",
      });
    }

    // Validate distanceByLeg matches routeDirections length
    if (distanceByLeg.length !== routeDirections.length) {
      return res.status(400).json({
        error:
          "distanceByLeg array length must match the number of routeDirections legs",
      });
    }

    // Validate each distance in distanceByLeg is positive
    if (distanceByLeg.some((dist) => typeof dist !== "number" || dist <= 0)) {
      return res.status(400).json({
        error: "All distances in distanceByLeg must be positive numbers",
      });
    }

    // Validate sum of distanceByLeg matches total distance
    const sumOfDistances = distanceByLeg.reduce((sum, dist) => sum + dist, 0);
    if (Math.abs(sumOfDistances - distance) > 0.01) {
      return res.status(400).json({
        error: "Sum of distanceByLeg must equal the total distance",
      });
    }

    // Validate API key presence
    if (!CARBON_INTERFACE_API_KEY) {
      throw new Error(
        "Carbon Interface API key is not configured. Please set CARBON_INTERFACE_API_KEY in your environment variables."
      );
    }

    // Step 1: Calculate emissions for each leg using Carbon Interface API
    let totalEmissions = 0;
    const routeAnalysis = [];
    const perLegEmissions = []; // Array to store emissions for each leg (for the prompt)

    for (let i = 0; i < routeDirections.length; i++) {
      const segment = routeDirections[i];
      const mode = segment.state.toLowerCase();
      const segmentDistance = distanceByLeg[i]; // Use the provided distance for this leg

      // Map the mode to Carbon Interface API's transport method
      let transportMethod;
      switch (mode) {
        case "land":
          transportMethod = "truck";
          break;
        case "sea":
          transportMethod = "ship";
          break;
        case "air":
          transportMethod = "plane";
          break;
        default:
          throw new Error(`Unsupported transport mode: ${mode}`);
      }

      // Fetch emissions data from Carbon Interface API
      const apiResponse = await axios.post(
        "https://www.carboninterface.com/api/v1/estimates",
        {
          type: "shipping",
          weight_value: weight,
          weight_unit: "kg",
          distance_value: segmentDistance,
          distance_unit: "km",
          transport_method: transportMethod,
        },
        {
          headers: {
            Authorization: `Bearer ${CARBON_INTERFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Accept both 200 OK and 201 Created as successful responses
      if (![200, 201].includes(apiResponse.status) || !apiResponse.data.data) {
        throw new Error(
          `Carbon Interface API failed: Status ${
            apiResponse.status
          }, Response: ${JSON.stringify(apiResponse.data)}`
        );
      }

      const emissions = apiResponse.data.data.attributes.carbon_kg; // Emissions in kg CO2e
      totalEmissions += emissions;
      perLegEmissions.push(emissions); // Store per-leg emissions for the prompt

      routeAnalysis.push({
        leg: `Leg ${i + 1}`,
        origin: segment.waypoints[0],
        destination: segment.waypoints[1],
        mode: mode,
        distance: `${segmentDistance.toFixed(2)} km`,
        emissions: `${emissions.toFixed(2)} kg CO2e`,
      });
    }

    // Step 2: Use Gemini AI to generate suggestions and environmental impact
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a carbon footprint analysis AI for Movex, focused on providing actionable insights to reduce environmental impact. Use the following data to generate suggestions for reducing emissions and a description of the environmental impact as of June 08, 2025.

      **Inputs**:
      - **Origin**: ${origin}
      - **Destination**: ${destination}
      - **Total Distance**: ${distance} km
      - **Total Emissions**: ${totalEmissions} kg CO2e
      - **Weight**: ${weight} kg
      - **Route Analysis**: ${JSON.stringify(routeAnalysis)}
      - **Per-Leg Emissions (kg CO2e)**: ${JSON.stringify(perLegEmissions)}

      **Instructions**:
      - Analyze the **Route Analysis** and **Per-Leg Emissions** to identify high-emission segments (e.g., air transport typically has higher emissions than sea).
      - For each leg in the Route Analysis, note the emissions from Per-Leg Emissions:
        - Leg 1 emissions: ${perLegEmissions[0] || 0} kg CO2e
        - Leg 2 emissions: ${perLegEmissions[1] || 0} kg CO2e
        - Leg 3 emissions: ${perLegEmissions[2] || 0} kg CO2e (if applicable)
        - Continue for all legs as needed.
      - Consider the total emissions (${totalEmissions} kg CO2e), weight (${weight} kg), and per-leg emissions to provide practical suggestions.
      - For suggestions, focus on:
        1. Reducing emissions by targeting high-emission segments identified in Per-Leg Emissions (e.g., "Switch Leg X from air to sea freight to reduce emissions by approximately X%").
        2. Practical actions like optimizing shipment weight, consolidating shipments, or adjusting routes based on the emissions data.
      - For earthImpact, estimate the environmental impact using a relatable metric (e.g., "Equivalent to X trees absorbing CO2e for a year" or "Equivalent to Y car trips from ${origin} to ${destination}"). Use approximate conversion factors (e.g., 1 tree absorbs ~20 kg CO2e/year, 1 car trip of 100 km emits ~20 kg CO2e).

      **Response Format**:
      {
        "suggestions": [
          "Targeted suggestion based on per-leg emissions (e.g., 'Switch Leg X from air to sea freight to reduce emissions by X%')",
          "Practical suggestion (e.g., 'Consolidate shipments to reduce the number of trips')"
        ],
        "earthImpact": "A short description of the environmental impact (e.g., 'Equivalent to X trees absorbing CO2e for a year')"
      }

      Ensure the response is concise, actionable, and directly uses the provided per-leg emissions data to inform suggestions.
    `;

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    // Extract JSON from Gemini AI response
    const jsonMatch = rawResponse.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }

    let aiData;
    try {
      aiData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError.message);
      const cleanedResponse = rawResponse
        .replace(/([{,]\s*)(\w+)(:)/g, '$1"$2"$3')
        .replace(/'/g, '"');
      try {
        aiData = JSON.parse(cleanedResponse);
      } catch (cleanedParseError) {
        throw new Error("Failed to parse AI response as valid JSON");
      }
    }

    // Step 3: Construct the final response
    const responseData = {
      totalDistance: `${distance.toFixed(2)} km`,
      totalEmissions: `${totalEmissions.toFixed(2)} kg CO2e`,
      routeAnalysis: routeAnalysis,
      suggestions: aiData.suggestions,
      earthImpact: aiData.earthImpact,
    };

    // Step 4: Save or update draft
    let draft;
    if (draftId) {
      if (!mongoose.Types.ObjectId.isValid(draftId)) {
        return res.status(400).json({ error: "Invalid draftId format" });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId format" });
      }

      draft = await Draft.findOneAndUpdate(
        { _id: draftId, userId },
        { $set: { carbonAnalysis: responseData } },
        { new: true, runValidators: true }
      );

      if (!draft) {
        return res
          .status(404)
          .json({ error: "Draft not found or not authorized" });
      }
    } else {
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
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      await draft.save();
    }

    if (!draft) {
      throw new Error("Failed to create or update draft");
    }

    res.status(200).json({
      ...responseData,
      draftId: draft._id.toString(),
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
