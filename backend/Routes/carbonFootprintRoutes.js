const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Carbon Footprint Analysis
router.post("/api/carbon-footprint", async (req, res) => {
  try {
    const { origin, destination, distance, weight, routeDirections } = req.body;

    if (!origin || !destination || !distance || !weight || !routeDirections) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const prompt = `
      You are a carbon footprint analysis AI for Movex. Based on the following inputs, provide a structured JSON response for a genuine carbon footprint analysis as of April 4, 2025. Use real-world CO2e emission factors: Land (0.07 kg/km), Sea (0.01 kg/km), Air (0.60 kg/km).

      Inputs:
      - Origin: ${origin}
      - Destination: ${destination}
      - Total Distance: ${distance} km
      - Shipment Weight: ${weight} kg
      - Route Directions: ${JSON.stringify(routeDirections)}

      Calculate emissions based on the transport mode ("state") in each routeDirections segment (land, sea, air). Distribute the total distance proportionally across segments if multiple exist.

      Response Format (JSON):
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
        "earthImpact": "A short description of the environmental impact (e.g., 'Equivalent to X trees absorbing CO2 for a year')"
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

    res.json(responseData);
  } catch (error) {
    console.error("Error in carbon footprint endpoint:", error);
    res.status(500).json({
      error: "Failed to generate carbon footprint analysis",
      details: error.message,
    });
  }
});

module.exports = router;
