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
    const { from, to, package, description, draftId } = req.body;

    if (!from || !to || !package || !description) {
      return res.status(400).json({
        error: "Missing required fields: from, to, package, and description",
      });
    }

    const { quantity, weight, height, length, width } = package;
    if (
      !quantity ||
      !weight ||
      !height ||
      !length ||
      !width ||
      isNaN(quantity) ||
      isNaN(weight) ||
      isNaN(height) ||
      isNaN(length) ||
      isNaN(width) ||
      quantity <= 0 ||
      weight <= 0 ||
      height <= 0 ||
      length <= 0 ||
      width <= 0
    ) {
      return res.status(400).json({
        error:
          "Package details (quantity, weight, height, length, width) must be valid positive numbers",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a highly intelligent, logistics-aware route optimization AI. Your task is to generate realistic, operationally valid, and cost-consistent shipping routes between two global locations, precisely estimating distance, cost, time, and environmental impact based on the provided inputs. Use current industry standards and reference DHL's quote generator for cost calculations.

Inputs Provided:
- Origin: ${from}
- Destination: ${to}
- Package Details:
  - Quantity: ${quantity}
  - Weight: ${weight} kg
  - Dimensions: ${length}x${width}x${height} cm
- Description: ${description}

Instructions:
- If a country code or region is provided (e.g., "EU", "FR", "IN"), replace it with a major city in that region or country (e.g., "EU" → "Brussels, Belgium", "FR" → "Paris, France", "IN" → "Mumbai, India").
- Determine if the shipment from ${from} to ${to} is domestic (same country) or international (different countries) to select appropriate routing rules.
- Analyze package details (quantity: ${quantity}, weight: ${weight} kg, dimensions: ${length}x${width}x${height} cm) and description ("${description}") to guide route selection and calculations:
  - Quantity (${quantity}) affects the number of containers/trucks and total cost.
  - Weight (${weight} kg) and dimensions (${length}x${width}x${height} cm) impact volumetric weight and mode selection.
  - Description ("${description}") keywords (e.g., "perishable," "hazardous," "fragile," "urgent") dictate special handling, surcharges, and preferred modes.
- Determine if the shipment from ${from} to ${to} is international (different countries). If so, generate the following 7 unique routes:
  - **2 air-prioritizing routes**: Use air as the main mode for the longest leg, with land legs only to connect cities to airports at origin and destination.
  - **2 sea-prioritizing routes**: Use sea as the main mode for the longest leg, with land legs only to connect cities to seaports at origin and destination.
  - **3 multimodal routes (air + sea + land)**: Combine all three modes in a logical, efficient sequence (e.g., land to airport, air to hub, land to seaport, sea to destination port, land to final destination).
- For each route:
  - All waypoints and transitions must be geographically and operationally valid.
  - No unnecessary detours or illogical mode changes.
  - Always include a land leg from city to nearest airport/seaport and from final airport/seaport to destination city.
Routing Logic:
- Generate only practical, geographically valid routes from ${from} to ${to} using appropriate waypoints:
  - Land legs: between cities and ports/airports.
  - Air legs: between international airports.
  - Sea legs: between commercial seaports.
- Always include a land leg from the city to the nearest port/airport, and from the final port/airport to the destination city.
- Do not generate illogical routes such as direct city-to-airport or city-to-port air/sea legs, unnecessary detours, or consecutive land legs without a port/airport transition.

Distance Calculation:
- Use real-world data for each leg:
  - Land: road distance (e.g., Google Maps).
  - Air: great-circle distance between airports.
  - Sea: maritime distance between ports.
- Ensure each leg's distance is a positive number greater than 0 and matches actual geography.

Cost Calculation:
- Reference DHL's quote generator for rates and surcharges.
- Calculate volumetric weight: (length x width x height) / 5000 (in kg).
- Use the higher of actual weight (${weight} kg) or volumetric weight for cost.
- Multiply base rate by quantity (${quantity}).
- Apply surcharges for special handling based on description ("${description}").
- Ensure total cost is realistic and consistent with DHL's published rates.

Time Estimation:
- Land: (distance/60) + 6h (domestic), +18h (international).
- Air: 48-72h international, 12-24h domestic.
- Sea: 192-216h (short/medium haul), 600-1080h (long haul).
- Add 10% time for special cargo (from description).
- Convert total hours to days range (e.g., 48-72h → "2-3 days").

Carbon Score:
- Air: 70-100
- Sea: 20-40
- Land: 40-60
- Adjust based on distance, weight, and mode mix.
- carbon score must lie in range of 0-100.

Validation:
- All routes must be unique, operationally valid, and geographically correct.
- Distances, costs, and times must be cross-checked with real-world data and DHL rates.
- No duplicate or illogical routes.

Tagging Popular Routes:
- Tag three routes as "popular":
  1. Lowest totalCost (using higher of weight or volumetric weight and any surcharges from description).
  2. Shortest totalTime (prioritize if description indicates urgency).
  3. Lowest totalCarbonScore (favor eco-friendly options).
- If overlap, select the next best distinct route.

Output Format:
Return only a JSON array of route objects, each with:
- routeDirections: Array of { id, waypoints, state ("land"|"sea"|"air"), distance (km) }
- totalDistance: Number (km)
- totalCost: Number (USD)
- totalTime: Number (hours)
- totalTimeDaysRange: String (e.g., "2-3 days")
- totalCarbonScore: Number (0-100)
- tag: "popular" or null

Example Output:
[
  {
    "routeDirections": [
      {"id": "leg1", "waypoints": ["${from}", "Port A"], "state": "land", "distance": 50},
      {"id": "leg2", "waypoints": ["Port A", "Port B"], "state": "sea", "distance": 4000},
      {"id": "leg3", "waypoints": ["Port B", "${to}"], "state": "land", "distance": 30}
    ],
    "totalDistance": 4080,
    "totalCost": 3200,
    "totalTime": 432,
    "totalTimeDaysRange": "18 days",
    "totalCarbonScore": 38,
    "tag": "popular"
  }
]
Return only the clean, parseable JSON array. No extra text.
`;

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    // Clean and parse response
    const cleanedResponse = rawResponse.replace(/```json\n|\n```/g, "").trim();
    const jsonString = cleanedResponse.replace(
      /"tag":\s*undefined/g,
      '"tag": null'
    );
    const jsonMatch = jsonString.match(/\[.*\]/s);

    if (!jsonMatch) {
      console.error("No valid JSON array found:", rawResponse);
      throw new Error("No valid JSON array found");
    }

    let aiGeneratedRoutes;
    try {
      aiGeneratedRoutes = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw:", rawResponse);
      throw new Error("Invalid JSON format");
    }

    if (!Array.isArray(aiGeneratedRoutes)) {
      return res.status(500).json({ error: "AI response is not an array" });
    }

    const finalRoutes = aiGeneratedRoutes.map((route) => {
      if (
        !route.routeDirections ||
        !Array.isArray(route.routeDirections) ||
        route.routeDirections.length === 0 ||
        typeof route.totalCost !== "number" ||
        typeof route.totalTime !== "number" ||
        typeof route.totalCarbonScore !== "number" ||
        route.totalCarbonScore < 0 ||
        route.totalCarbonScore > 100 ||
        typeof route.totalTimeDaysRange !== "string"
      ) {
        console.warn("Invalid route:", route);
        throw new Error("Invalid route data");
      }

      // Calculate totalDistance as the sum of leg distances
      const legDistances = route.routeDirections.map((leg) => {
        if (typeof leg.distance !== "number" || leg.distance <= 0) {
          console.warn("Invalid leg distance:", leg);
          throw new Error("Each leg must have a valid positive distance");
        }
        return leg.distance;
      });

      const totalDistance = legDistances.reduce((sum, dist) => sum + dist, 0);

      return {
        routeDirections: route.routeDirections.map((leg) => ({
          id: leg.id,
          waypoints: leg.waypoints,
          state: leg.state,
          distance: parseFloat(leg.distance.toFixed(2)),
        })),
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalCost: parseFloat(route.totalCost.toFixed(2)),
        totalTime: parseFloat(route.totalTime.toFixed(2)),
        totalTimeDaysRange: route.totalTimeDaysRange, // Include the days range
        totalCarbonScore: parseFloat(route.totalCarbonScore.toFixed(2)),
        tag: route.tag,
        distanceByLeg: legDistances.map((dist) => parseFloat(dist.toFixed(2))),
      };
    });

    // console.log("Final Routes:", finalRoutes);
    res.json(finalRoutes);
  } catch (error) {
    console.error("Error in route optimization:", error);
    res.status(500).json({ error: "Failed to generate route optimization" });
  }
});

// POST /api/routes - Process routes and store in draft
router.post("/api/routes", verifyToken, async (req, res) => {
  try {
    const routesData = req.body;
    const userId = req.user.id;

    const draftId = routesData.find((item) => item.draftId)?.draftId;

    if (!Array.isArray(routesData) || routesData.length === 0) {
      return res.status(400).json({ error: "Invalid or empty routes data" });
    }

    const cleanedRoutesDataForProcessing = routesData.filter(
      (item) => !item.draftId
    );

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      You are a geocoding validation AI tasked with correcting and standardizing waypoints in shipping routes to ensure they are geocodable by Google Maps API and formatted for display. For each waypoint in the provided routes, return a specific, geocodable place name in the format expected by Google Maps (e.g., cities as "City, Country", ports and airports with their official names and locations like "Jawaharlal Nehru Port, Mumbai, Maharashtra, India"). Handle the following cases:

      - **Cities** (e.g., "Pune", "Tokyo"):
        - Format as "City, Country" (e.g., "Pune" → "Pune, India", "Tokyo" → "Tokyo, Japan").
      - **Country codes or vague regions** (e.g., "EU", "FR", "IN"):
        - Replace with a major city in that region/country (e.g., "EU" → "Brussels, Belgium", "FR" → "Paris, France", "IN" → "Mumbai, Maharashtra, India").
      - **Ports** (e.g., "Mumbai Port", "Tokyo Port"):
        - Convert to their official port names as recognized by Google Maps, including the city and country (e.g., "Mumbai Port" → "Jawaharlal Nehru Port, Mumbai, Maharashtra, India", "Tokyo Port" → "Port of Tokyo, Tokyo, Japan").
      - **Airports** (e.g., "DEL Airport", "NRT Airport"):
        - Convert to their official airport names as recognized by Google Maps, including the city and country (e.g., "DEL Airport" → "Indira Gandhi International Airport, Delhi, India", "NRT Airport" → "Narita International Airport, Narita, Chiba, Japan").
      - **Invalid or non-existent locations**:
        - Replace with a sensible default city in the same region or country, or the closest major city (e.g., "UnknownPort" → "Mumbai, Maharashtra, India" if in India).
      - **Ensure waypoints match the transport mode**:
        - Land: Major cities or logistics hubs (e.g., "Delhi, India").
        - Sea: Major ports with official names (e.g., "Jawaharlal Nehru Port, Mumbai, Maharashtra, India").
        - Air: Airports with official names (e.g., "Indira Gandhi International Airport, Delhi, India").
      - **Already geocodable waypoints** (e.g., "Mumbai BOM", "Port of Rotterdam"):
        - If already geocodable, format for consistency (e.g., "Mumbai BOM" → "Chhatrapati Shivaji Maharaj International Airport, Mumbai, Maharashtra, India", "Port of Rotterdam" → "Port of Rotterdam, Rotterdam, Netherlands").

      **Input**:
      ${JSON.stringify(cleanedRoutesDataForProcessing, null, 2)}

      **Output Format**:
      Return a JSON array matching the input structure, with corrected and standardized waypoints. Preserve the "id" and "state" fields. Only modify "waypoints" to ensure they are geocodable and properly formatted for display. Example:
      [
        {
          "id": "segment1",
          "waypoints": ["Pune, India", "Jawaharlal Nehru Port, Mumbai, Maharashtra, India"],
          "state": "land"
        },
        {
          "id": "segment2",
          "waypoints": ["Jawaharlal Nehru Port, Mumbai, Maharashtra, India", "Port of Tokyo, Tokyo, Japan"],
          "state": "sea"
        }
      ]

      **Instructions**:
      - Return only the JSON array, with no additional text or explanations.
      - Ensure all waypoints are specific, geocodable, and formatted as "Place, City, Country" or "Official Name, City, Country" for ports and airports.
      - If a waypoint cannot be corrected, use a default major city in the same region.
    `;

    let cleanedRoutesData = cleanedRoutesDataForProcessing;
    try {
      const result = await model.generateContent(prompt);
      const rawResponse = result.response.text();

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
    } catch (geminiError) {
      console.error("Error cleaning routes with Gemini:", geminiError);
      console.warn("Using original routesData due to Gemini failure");
    }

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

    const mapData = {
      routes: responseData,
      originalRoute: cleanedRoutesData,
    };

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
        { $set: { mapData } },
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

    // Validate required fields: from, to, and weight (from package)
    if (
      !formData.from ||
      !formData.to ||
      !formData.package ||
      !formData.package.weight
    ) {
      return res.status(400).json({
        error:
          "formData must include from, to, and package with weight as required fields",
      });
    }

    const weight = Number(formData.package.weight);
    if (isNaN(weight) || weight <= 0) {
      return res
        .status(400)
        .json({ error: "Weight must be a valid positive number" });
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
