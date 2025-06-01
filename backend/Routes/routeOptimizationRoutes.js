const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const SaveRoute = require("../Database/saveRouteSchema");
const Draft = require("../Database/draftSchema"); // Add Draft import
const { verifyToken } = require("../Middleware/auth");
const { getDirections, geocodeAddress } = require("../Utils/geocode");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Route Optimization
router.post("/api/route-optimization", async (req, res) => {
  try {
    const { from, to, weight } = req.body;

    if (!from || !to || !weight) {
      return res
        .status(400)
        .json({ error: "Missing required fields: from, to, and weight" });
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Simplified prompt for the AI to focus on route generation and waypoints
    const prompt = `You are a route optimization AI tasked with generating 9 unique shipping routes between two locations.
        Focus on creating diverse and realistic routes with appropriate waypoints and transport modes.
        Do not calculate costs, time, distance, or carbon scores; just provide the route directions.

        **Inputs**:
        - Origin: ${from}
        - Destination: ${to}
        - Shipment Weight: ${weight} kg

        **Route Requirements**:
        - Provide 9 distinct routes.
        - Each route must have 2 to 5 waypoints (inclusive).
        - Use real, geographically relevant locations for waypoints.
        - Use specific and functional waypoints:
            - Sea: Functional seaports (e.g., "Mumbai Port", "Port of Rotterdam").
            - Air: Operational airports (e.g., "Mumbai BOM", "London Heathrow LHR").
            - Land: Major cities or logistics hubs (e.g., "Delhi", "Frankfurt").
        - Define each segment as:
            { "id": "unique-string", "waypoints": ["start", "end"], "state": "land" | "sea" | "air" }
        - Categorize the 9 routes as follows (try to achieve this, but we'll enforce it post-processing):
            - 3 routes must be primarily multimodal (use at least two different modes: land, sea, or air).
            - 3 routes must primarily use air transport.
            - 3 routes must primarily use sea transport.
        - For multi-segment routes, list consecutive same-mode segments separately if they represent distinct legs.
        - Ensure transport mode matches waypoint capabilities (e.g., sea only between ports, air only between airports).

        **Output Format**:
        - Return a JSON array of 9 routes, with no text outside the array.
        - Each route object should only contain the "routeDirections" array.
        [
            {
                "routeDirections": [
                    { "id": "string", "waypoints": ["string", "string"], "state": "land" | "sea" | "air" }
                ]
            },
            ...
        ]
        `;

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    // Robust JSON extraction
    const jsonMatch = rawResponse.match(/\[.*\]/s);
    if (!jsonMatch) {
      console.error("No valid JSON array found in AI response:", rawResponse);
      throw new Error("No valid JSON array found in AI response");
    }
    const jsonString = jsonMatch[0];

    let aiGeneratedRoutes;
    try {
      aiGeneratedRoutes = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(
        "JSON Parse Error:",
        parseError,
        "Raw Response:",
        rawResponse
      );
      throw new Error("Invalid JSON format in AI response");
    }

    // --- Post-processing and Calculation Logic ---
    const getApproximateDistance = (start, end, state) => {
      const distances = {
        "Mumbai-London": { air: 7200, sea: 10000, land: 12000 },
        "Mumbai-Singapore": { air: 3900, sea: 4500, land: 6000 },
        "Singapore-Tokyo": { air: 5300, sea: 5800, land: 7000 },
        "London-New York": { air: 5500, sea: 6000, land: 0 },
        "New York-Los Angeles": { air: 3900, sea: 6000, land: 4500 },
        "Chennai-Dubai": { air: 2900, sea: 3500, land: 0 },
        "Rotterdam-Hamburg": { land: 450, sea: 300, air: 600 },
        "Shanghai-Sydney": { air: 7900, sea: 9000, land: 0 },
        "Mumbai-Delhi": { land: 1400, air: 1150 },
        "Delhi-Kolkata": { land: 1500, air: 1300 },
      };

      const key1 = `${start}-${end}`;
      const key2 = `${end}-${start}`;

      if (distances[key1] && distances[key1][state]) {
        return distances[key1][state];
      }
      if (distances[key2] && distances[key2][state]) {
        return distances[key2][state];
      }

      switch (state) {
        case "air":
          return 1000 + Math.random() * 5000;
        case "sea":
          return 1500 + Math.random() * 7000;
        case "land":
          return 300 + Math.random() * 2000;
        default:
          return 0;
      }
    };

    const calculateRouteMetrics = (routeDirections, weight) => {
      let totalCost = 0;
      let totalTime = 0;
      let totalDistance = 0;
      let rawCO2 = 0;

      const rates = {
        air: {
          perKg: { min: 3, max: 6 },
          stopFee: { min: 50, max: 100 },
          kmh: 900,
          co2PerKm: 0.6,
          stopTime: 3,
        },
        sea: {
          perKg: { min: 0.02, max: 0.05 },
          stopFee: { min: 100, max: 200 },
          kmh: 40,
          co2PerKm: 0.01,
          stopTime: 12,
        },
        land: {
          perKg: { min: 0.1, max: 0.2 },
          stopFee: { min: 20, max: 50 },
          kmh: 60,
          co2PerKm: 0.07,
          stopTime: 2,
        },
      };

      routeDirections.forEach((segment) => {
        const mode = segment.state;
        const dist = getApproximateDistance(
          segment.waypoints[0],
          segment.waypoints[1],
          mode
        );
        totalDistance += dist;

        let perKgRate =
          rates[mode].perKg.min +
          Math.random() * (rates[mode].perKg.max - rates[mode].perKg.min);
        if (weight > 500) perKgRate *= 0.8;
        else if (weight > 100) perKgRate *= 0.9;

        totalCost +=
          perKgRate * weight +
          (rates[mode].stopFee.min +
            Math.random() *
              (rates[mode].stopFee.max - rates[mode].stopFee.min));

        totalTime += dist / rates[mode].kmh + rates[mode].stopTime;
        rawCO2 += rates[mode].co2PerKm * dist * weight;
      });

      if (totalDistance > 10000) {
        totalCost *= 1.1;
      }

      return { totalCost, totalTime, totalDistance, rawCO2 };
    };

    let processedRoutes = [];
    let allRawCO2s = [];

    for (const route of aiGeneratedRoutes) {
      if (
        !route.routeDirections ||
        !Array.isArray(route.routeDirections) ||
        route.routeDirections.length === 0
      ) {
        console.warn(
          "Skipping invalid AI-generated route (missing routeDirections):",
          route
        );
        continue;
      }

      const { totalCost, totalTime, totalDistance, rawCO2 } =
        calculateRouteMetrics(route.routeDirections, weight);
      allRawCO2s.push(rawCO2);

      processedRoutes.push({
        routeDirections: route.routeDirections,
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalTime: parseFloat(totalTime.toFixed(2)),
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        rawCO2: rawCO2,
      });
    }

    if (allRawCO2s.length === 0) {
      return res.status(500).json({
        error: "No valid routes could be processed from AI response.",
      });
    }

    const maxRawCO2 = Math.max(...allRawCO2s);

    processedRoutes = processedRoutes.map((route) => {
      const totalCarbonScore = (route.rawCO2 / maxRawCO2) * 100;
      delete route.rawCO2;
      return {
        ...route,
        totalCarbonScore: parseFloat(totalCarbonScore.toFixed(2)),
      };
    });

    let finalRoutes = [];
    const uniqueRouteSignatures = new Set();

    for (const route of processedRoutes) {
      const signature = route.routeDirections
        .map((seg) => `${seg.waypoints.join("-")}:${seg.state}`)
        .join("|");
      if (!uniqueRouteSignatures.has(signature) && finalRoutes.length < 9) {
        finalRoutes.push(route);
        uniqueRouteSignatures.add(signature);
      }
    }

    while (finalRoutes.length < 9) {
      const dummyRoute = {
        routeDirections: [
          {
            id: `dummy-segment-${finalRoutes.length}-1`,
            waypoints: [`${from}`, `${to}`],
            state: "land",
          },
        ],
        totalCost: parseFloat((500 + Math.random() * 500).toFixed(2)),
        totalTime: parseFloat((24 + Math.random() * 48).toFixed(2)),
        totalDistance: parseFloat((500 + Math.random() * 1500).toFixed(2)),
        totalCarbonScore: parseFloat((50 + Math.random() * 30).toFixed(2)),
      };
      finalRoutes.push(dummyRoute);
    }

    const routesToTag = new Set();
    while (routesToTag.size < 3 && finalRoutes.length >= 3) {
      routesToTag.add(Math.floor(Math.random() * finalRoutes.length));
    }
    routesToTag.forEach((index) => {
      finalRoutes[index].tag = "popular";
    });

    for (let i = finalRoutes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [finalRoutes[i], finalRoutes[j]] = [finalRoutes[j], finalRoutes[i]];
    }

    res.json(finalRoutes);
  } catch (error) {
    console.error("Error in route optimization:", error);
    res.status(500).json({ error: "Failed to generate route optimization" });
  }
});

// POST /api/routes - Process routes and store in draft
router.post("/api/routes", verifyToken, async (req, res) => {
  try {
    // Log request body for debugging
    // console.log("Request body:", req.body);

    // Expect routesData as an array
    const routesData = req.body;
    const userId = req.user.id; // Get userId from JWT token

    // Extract draftId from the request body
    const draftId = routesData.find((item) => item.draftId)?.draftId;

    if (!Array.isArray(routesData) || routesData.length === 0) {
      return res.status(400).json({ error: "Invalid or empty routes data" });
    }

    // Filter out the draftId object from routesData for processing
    const cleanedRoutesDataForProcessing = routesData.filter(
      (item) => !item.draftId
    );

    // Validate and clean waypoints using Gemini
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      You are a geocoding validation AI tasked with correcting invalid or ambiguous waypoints in shipping routes to ensure they are geocodable by Google Maps API. For each waypoint in the provided routes, return a specific, geocodable place name (e.g., city, airport, or port with proper formatting like "Mumbai, Maharashtra, India"). Handle the following cases:
      - Country codes (e.g., "EU", "FR", "IN"): Replace with a major city (e.g., "EU" → "Brussels, Belgium", "FR" → "Paris, France", "IN" → "Mumbai, Maharashtra, India").
      - Vague or non-specific ports (e.g., "Mumbai Port"): Replace with the city (e.g., "Mumbai, Maharashtra, India").
      - Invalid or non-existent locations: Replace with a sensible default city in the same region or country, or the closest major city.
      - Valid waypoints (e.g., "Mumbai BOM", "Port of Rotterdam"): Keep as-is if geocodable, or format properly (e.g., "Mumbai, Maharashtra, India" for consistency).
      - Ensure waypoints match the transport mode:
        - Land: Major cities or logistics hubs (e.g., "Delhi, India").
        - Sea: Major ports or nearby cities (e.g., "Rotterdam, Netherlands").
        - Air: Airports or cities with airports (e.g., "London Heathrow LHR" or "London, United Kingdom").
      
      **Input**:
      ${JSON.stringify(cleanedRoutesDataForProcessing, null, 2)}
      
      **Output Format**:
      Return a JSON array matching the input structure, with corrected waypoints. Preserve the "id" and "state" fields. Only modify "waypoints" to ensure they are geocodable. Example:
      [
        {
          "id": "segment1",
          "waypoints": ["Mumbai, Maharashtra, India", "Delhi, India"],
          "state": "land"
        },
        {
          "id": "segment2",
          "waypoints": ["Mumbai, Maharashtra, India", "Singapore, Singapore"],
          "state": "sea"
        }
      ]
      
      **Instructions**:
      - Return only the JSON array, with no additional text or explanations.
      - Ensure all waypoints are specific and geocodable.
      - If a waypoint cannot be corrected, use a default major city in the same region.
    `;

    let cleanedRoutesData = cleanedRoutesDataForProcessing; // Fallback to original data
    try {
      const result = await model.generateContent(prompt);
      const rawResponse = result.response.text();

      // Robust JSON extraction
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error(
          "No valid JSON array found in Gemini response:",
          rawResponse
        );
        throw new Error("Invalid JSON format in Gemini response");
      }

      const jsonString = jsonMatch[0];
      cleanedRoutesData = JSON.parse(jsonString);

      // Validate cleaned data structure
      if (
        !Array.isArray(cleanedRoutesData) ||
        cleanedRoutesData.length !== cleanedRoutesDataForProcessing.length
      ) {
        console.warn("Gemini response length mismatch:", cleanedRoutesData);
        throw new Error("Invalid cleaned routes data structure");
      }

      for (let i = 0; i < cleanedRoutesData.length; i++) {
        const cleaned = cleanedRoutesData[i];
        const original = cleanedRoutesDataForProcessing[i];
        if (
          !cleaned.id ||
          !cleaned.waypoints ||
          !cleaned.state ||
          cleaned.id !== original.id ||
          cleaned.state !== original.state ||
          !Array.isArray(cleaned.waypoints) ||
          cleaned.waypoints.length !== original.waypoints.length
        ) {
          console.warn("Invalid cleaned route segment:", cleaned);
          throw new Error(
            "Cleaned route segment does not match original structure"
          );
        }
      }

      // console.log("Cleaned routes data:", cleanedRoutesData);
    } catch (geminiError) {
      console.error("Error cleaning routes with Gemini:", geminiError);
      console.warn("Using original routesData due to Gemini failure");
    }

    // Process routes with cleaned data
    const responseData = {};
    for (const route of cleanedRoutesData) {
      try {
        if (!route.id || !route.waypoints || !route.state) {
          throw new Error("Missing required route fields");
        }
        if (route.state === "land") {
          const encodedPolyline = await getDirections(route.waypoints);
          responseData[route.id] = { encodedPolyline, state: route.state };
        } else if (route.state === "sea" || route.state === "air") {
          const coordinates = await Promise.all(
            route.waypoints.map(geocodeAddress)
          );
          responseData[route.id] = { coordinates, state: route.state };
        }
      } catch (routeError) {
        console.error(`Error processing route ${route.id}:`, routeError);
        responseData[route.id] = {
          error: `Failed to process route: ${routeError.message}`,
          state: route.state,
        };
      }
    }

    // Prepare mapData to save
    const mapData = {
      routes: responseData,
      originalRoute: cleanedRoutesData,
    };

    let draft;
    if (draftId) {
      // Update existing draft using findOneAndUpdate
      if (!mongoose.Types.ObjectId.isValid(draftId)) {
        return res.status(400).json({ error: "Invalid draftId format" });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId format" });
      }

      draft = await Draft.findOneAndUpdate(
        { _id: draftId, userId }, // Ensure the draft belongs to the authenticated user
        { $set: { mapData } }, // Update mapData
        { new: true, runValidators: true }
      );

      if (!draft) {
        return res
          .status(404)
          .json({ error: "Draft not found or not authorized" });
      }

      // console.log("Updated draft with mapData:", draft);
    } else {
      // Create temporary draft
      draft = new Draft({
        userId: req.user.id,
        formData: {},
        statuses: {
          compliance: "Not applicable",
          routeOptimization: "Not applicable",
        },
        mapData: { routes: responseData, originalRoute: cleanedRoutesData },
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      await draft.save();
      // console.log("Created temporary draft:", draft);
    }

    res.status(200).json({
      ...responseData,
      draftId: draft._id.toString(),
    });
  } catch (error) {
    console.error("Error processing routes:", error);
    res.status(500).json({
      error: "Failed to process routes",
      details: error.message,
    });
  }
});

// GET /api/routes/:draftId - Retrieve map data
router.get("/api/routes/:draftId", verifyToken, async (req, res) => {
  try {
    const { draftId } = req.params;
    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }
    if (!draft.mapData) {
      return res
        .status(404)
        .json({ error: "No map data found for this draft" });
    }
    res.json(draft.mapData);
  } catch (error) {
    console.error("Error retrieving map data:", error);
    res.status(500).json({
      error: "Failed to retrieve map data",
      details: error.message,
    });
  }
});

// Save Route
router.post("/api/save-route", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { formData, routeData } = req.body;

    if (!formData || !routeData) {
      return res.status(400).json({ error: "Missing formData or routeData" });
    }

    if (!formData.from || !formData.to || !formData.weight) {
      return res.status(400).json({
        error: "formData must include from, to, and weight as required fields",
      });
    }

    const weight = Number(formData.weight);
    if (isNaN(weight)) {
      return res.status(400).json({ error: "Weight must be a valid number" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }
    const validatedUserId = new mongoose.Types.ObjectId(userId);

    const saveRoute = await SaveRoute.create({
      userId: validatedUserId,
      formData: {
        from: formData.from,
        to: formData.to,
        weight: weight,
      },
      routeData,
      timestamp: new Date(),
    });

    res.json({
      message: "Route saved successfully",
      recordId: saveRoute._id,
    });
  } catch (error) {
    console.error("Error saving route:", error.stack);
    res.status(500).json({
      error: "Failed to save route",
      details: error.message,
    });
  }
});

// Get Route History
router.get("/api/route-history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const routeHistory = await SaveRoute.find({ userId }).sort({
      timestamp: -1,
    });

    res.json({ routeHistory });
  } catch (error) {
    console.error("Error fetching route history:", error.stack);
    res.status(500).json({
      error: "Failed to fetch route history",
      details: error.message,
    });
  }
});

router.delete("/api/route-history/:recordId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { recordId } = req.params;

    const record = await SaveRoute.findOneAndDelete({
      _id: recordId,
      userId,
    });

    if (!record) {
      return res.status(404).json({ error: "Route record not found" });
    }

    res.status(200).json({ message: "Route record deleted successfully" });
  } catch (error) {
    console.error("Error deleting route record:", error);
    res.status(500).json({ error: "Failed to delete route record" });
  }
});

module.exports = router;
