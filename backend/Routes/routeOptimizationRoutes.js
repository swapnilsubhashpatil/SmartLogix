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

    const prompt = `You are a highly intelligent, logistics-aware route optimization AI. Your task is to generate diverse, realistic, and efficient shipping routes between two global locations, precisely estimating distance, cost, time, and environmental impact based on the provided inputs.

**Inputs Provided**:
- **Origin**: ${from}
- **Destination**: ${to}
- **Package Details**:
  - Quantity: ${quantity}
  - Weight: ${weight} kg
  - Dimensions: ${length}x${width}x${height} cm
- **Description**: ${description}

**Responsibilities**:
- Determine if the shipment from ${from} to ${to} is domestic (same country) or international (different countries) to select appropriate routing rules.
- Analyze package details (quantity: ${quantity}, weight: ${weight} kg, dimensions: ${length}x${width}x${height} cm) and description ("${description}") to guide route selection and calculations:
  - Quantity (${quantity}) determines if multiple containers or trucks are needed, impacting cost and mode choice.
  - Weight (${weight} kg) drives cost calculations, especially for air freight where weight-based pricing is critical.
  - Dimensions (${length}x${width}x${height} cm) affect volumetric weight for air freight and container requirements for sea freight.
  - Description ("${description}") keywords (e.g., "perishable," "hazardous," "fragile," "urgent") dictate special handling:
    - Perishable/urgent: Prioritize air routes for speed, increasing costs.
    - Hazardous: Select compliant routes, avoiding restricted modes, with surcharges.
    - Fragile: Prefer stable modes (land or sea) to minimize handling risks.

**Geographically Valid Waypoints**:
- **Sea**: Use commercial seaports (e.g., "Port of Shanghai", "Port of Rotterdam").
- **Air**: Use international airports (e.g., "JFK Airport", "Heathrow LHR").
- **Land**: Use logistics hubs or cities (e.g., "Chicago", "Lyon").

**Routing Logic**:
- Generate practical routes from ${from} to ${to} with mode-appropriate waypoints:
  - Sea: Only between seaports.
  - Air: Only between airports.
  - Land: Only between cities/hubs.
- For multimodal routes, define each segment distinctly, considering package details (weight: ${weight} kg, dimensions: ${length}x${width}x${height} cm).

**Routing Rules**:
- **Domestic Shipments** (if ${from} and ${to} are in the same country):
  - 2 direct land routes (1-3 waypoints each).
  - 2 multimodal routes (land + air, 1-3 waypoints each).
- **International Shipments** (if ${from} and ${to} are in different countries):
  - 2 routes prioritizing air + land (3-6 waypoints each).
  - 2 routes prioritizing sea + land (3-6 waypoints each).
  - 3 multimodal routes (land + sea + air, 3-6 waypoints each).
- Ensure all routes are unique, using established logistics corridors.

**Estimation Requirements**:
- Simulate current industry standards by referencing rates from DHL (https://www.dhl.com) and Freightos (https://www.freightos.com), adjusted for package details (quantity: ${quantity}, weight: ${weight} kg, dimensions: ${length}x${width}x${height} cm) and description ("${description}").
- **Distance**: Calculate in km using real-world geography from ${from} to ${to} for each mode, ensuring accuracy for each segment.
- **Cost (USD)**:
  - Use package details (weight: ${weight} kg, dimensions: ${length}x${width}x${height} cm) and description ("${description}") to calculate costs based on DHL and Freightos rates:
    - **Land**:
      - Domestic: $0.5-$2/kg/km, adjusted for quantity (${quantity}) and route demand.
      - International: $1.5-$3/kg/km, reflecting cross-border logistics.
      - For quantity (${quantity}) exceeding truck capacity, apply full truckload (FTL) rates (e.g., $1.20-$2.50/km) or less than truckload (LTL) rates ($40-$100/ton for ≤500 km).
      - Add 20% surcharge for hazardous or perishable cargo from "${description}".
    - **Air**:
      - Base on weight (${weight} kg) and volumetric weight (length × width × height / 5000 cm³), using DHL air freight rates ($5-$15/kg for standard, $8-$20/kg for express).
      - Use the higher of actual (${weight} kg) or volumetric weight.
      - Add 20% surcharge for special handling (e.g., perishable, hazardous) from "${description}".
    - **Sea**:
      - Use Freightos container rates: $1000-$5000 for 20-ft FCL, $1500-$8000 for 40-ft FCL, or $1-$5/kg for LCL, adjusted for distance and route popularity.
      - For quantity (${quantity}), calculate if multiple containers are needed based on dimensions (${length}x${width}x${height} cm).
      - Add 20% surcharge for special handling from "${description}".
- **Time (hours)**:
  - Land: Domestic: (distance/60) + 6; International: (distance/60) + 18.
  - Air: Domestic: 12-24; International: 48-96.
  - Sea: Short-haul: 168-288; Long-haul: 600-1080.
  - Add 10% time for special cargo (e.g., hazardous) from "${description}".
- **Carbon Score (0-100)**:
  - Air: 70-100 (high emissions).
  - Sea: 20-40 (low emissions).
  - Land: 40-60 (medium emissions).
  - Adjust based on distance, weight (${weight} kg), and mode mix, normalized across routes.

**Validation**:
- Recheck routes for realism:
  - Ensure waypoints match modes (e.g., sea routes use ports like "Port of Shanghai").
  - Verify distances align with geographical paths from ${from} to ${to}.
  - Confirm costs reflect DHL and Freightos rates, adjusted for package details (weight: ${weight} kg, dimensions: ${length}x${width}x${height} cm) and special handling from "${description}".
  - Ensure times and carbon scores align with industry norms and package requirements.
- Adjust any outliers to maintain consistency with real-world logistics data.

**Tagging Popular Routes**:
- Tag three routes as "popular" based on package details (quantity: ${quantity}, weight: ${weight} kg, dimensions: ${length}x${width}x${height} cm) and description ("${description}"):
  - One with the lowest totalCost, optimized for ${weight} kg and any special handling.
  - One with the shortest totalTime, prioritizing speed if "${description}" indicates urgency.
  - One with the lowest totalCarbonScore, favoring eco-friendly options.
- If overlap occurs, select the next best distinct route to ensure diversity.

**Constraints**:
- No duplicate routes; ensure operational and geographical validity.
- Do not alter origin (${from}) or destination (${to}).

**Output Format**:
- Return only a JSON array of route objects:
  - "routeDirections": Array of { "id": "unique-string", "waypoints": ["start", "end"], "state": "land" | "sea" | "air" }
  - "totalDistance": number (km)
  - "totalCost": number (USD)
  - "totalTime": number (hours)
  - "totalCarbonScore": number (0-100)
  - "tag": "popular" or null
- Ensure clean, parseable JSON with no extra text.`;

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
        typeof route.totalDistance !== "number" ||
        typeof route.totalCost !== "number" ||
        typeof route.totalTime !== "number" ||
        typeof route.totalCarbonScore !== "number" ||
        route.totalCarbonScore < 0 ||
        route.totalCarbonScore > 100
      ) {
        console.warn("Invalid route:", route);
        throw new Error("Invalid route data");
      }
      return {
        routeDirections: route.routeDirections,
        totalDistance: parseFloat(route.totalDistance.toFixed(2)),
        totalCost: parseFloat(route.totalCost.toFixed(2)),
        totalTime: parseFloat(route.totalTime.toFixed(2)),
        totalCarbonScore: parseFloat(route.totalCarbonScore.toFixed(2)),
        tag: route.tag,
      };
    });

    console.log("Final Routes:", finalRoutes);
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
