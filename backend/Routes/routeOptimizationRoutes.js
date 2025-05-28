const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const SaveRoute = require("../Database/saveRouteSchema");
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

    const prompt = `You are a route optimization AI tasked with generating 9 unique shipping routes between two locations, using real-world logistics insights as of April 4, 2025. Exactly 3 routes must be tagged as "popular" based on common usage or historical preference. Each route must differ in waypoints, transport modes, or both.

**Inputs**:
- Origin: ${from}
- Destination: ${to}
- Shipment Weight: ${weight} kg

**Route Requirements**:
- Provide 9 distinct routes, each with 2 to 5 waypoints (inclusive), using real, geographically relevant locations.
- Tag exactly 3 routes with "popular" (property: "tag": "popular").
- Use specific waypoints:
  - Sea: Functional seaports (e.g., "Mumbai Port").
  - Air: Operational airports (e.g., "Mumbai BOM").
  - Land: Major cities or hubs.
- Define each segment as:
  { "id": "unique-string", "waypoints": ["start", "end"], "state": "land" | "sea" | "air" }
- Categorize the 9 routes as follows:
  - 3 routes must be multimodal (use at least two different modes: land, sea, or air).
  - 3 routes must prioritize air (use air for the majority of segments).
  - 3 routes must prioritize sea (use sea for the majority of segments).
- For multi-segment routes, list consecutive same-mode segments separately.
- Ensure transport mode matches waypoint capabilities (e.g., sea only between ports, air only between airports).

**Field Calculations**:
- **totalCost (USD)**:
  - Estimate the shipping cost for ${weight} kg across each route’s modes and waypoints.
  - Use real-world rates as of April 4, 2025:
    - Air: $3–$6/kg, plus airport fees (~$50–$100 per stop).
    - Sea: $0.02–$0.05/kg, plus port fees (~$100–$200 per stop).
    - Land: $0.10–$0.20/kg, plus transfer fees (~$20–$50 per stop).
  - Adjust for:
    - Economies of scale (reduce per-kg rate slightly for >100 kg, more for >500 kg).
    - Distance (add ~10% surcharge if total distance > 10,000 km).
  - Provide practical, industry-aligned estimates without a fixed formula.
- **totalTime (hours)**:
  - Calculate using:
    - Land: 60 km/h, +2 hours per waypoint.
    - Sea: 40 km/h, +12 hours per waypoint.
    - Air: 900 km/h, +3 hours per waypoint.
  - Sum segment times, including transfer delays.
- **totalDistance (km)**:
  - Approximate great-circle distances between waypoints (e.g., Mumbai to Tokyo ~6,700 km).
  - Ensure estimates are reasonable and cumulative across segments.
- **totalCarbonScore (0–100)**:
  - Compute Raw CO2 = (CO2/km * totalDistance * ${weight}).
  - CO2 rates: Land: 0.07 kg/km, Sea: 0.01 kg/km, Air: 0.60 kg/km.
  - Normalize: totalCarbonScore = (Raw CO2 / Max Raw CO2 across all 9 routes) * 100.

**Output Format**:
- Return a JSON array of 9 routes, with no text outside the array:
  [
    {
      "routeDirections": [
        { "id": "string", "waypoints": ["string", "string"], "state": "land" | "sea" | "air" }
      ],
      "totalCost": number,
      "totalTime": number,
      "totalDistance": number,
      "totalCarbonScore": number,
      "tag": "popular" | undefined
    },
    ...
  ]
- Round all numbers to 2 decimal places.
- Ensure mode-waypoint compatibility (e.g., no air routes between non-airports).
`;
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    // Robust JSON extraction
    const jsonMatch = rawResponse.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error("No valid JSON array found in AI response");
    }
    const jsonString = jsonMatch[0];

    let routes;
    try {
      routes = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(
        "JSON Parse Error:",
        parseError,
        "Raw Response:",
        rawResponse
      );
      throw new Error("Invalid JSON format in AI response");
    }

    // Enhanced validation
    if (!Array.isArray(routes) || routes.length !== 9) {
      return res
        .status(500)
        .json({ error: "AI response must contain exactly 9 unique routes" });
    }

    const popularRoutesCount = routes.filter(
      (route) => route.tag === "popular"
    ).length;
    if (popularRoutesCount !== 3) {
      return res
        .status(500)
        .json({ error: "AI response must tag exactly 3 routes as 'popular'" });
    }

    // Check for route uniqueness
    const routeSignatures = new Set();
    for (const route of routes) {
      const signature = route.routeDirections
        .map((seg) => `${seg.waypoints.join("-")}:${seg.state}`)
        .join("|");
      if (routeSignatures.has(signature)) {
        return res
          .status(500)
          .json({ error: "AI response contains duplicate routes" });
      }
      routeSignatures.add(signature);
    }

    // Validate required fields and data types
    const requiredFields = [
      "routeDirections",
      "totalCost",
      "totalTime",
      "totalDistance",
      "totalCarbonScore",
    ];
    const isValid = routes.every((route) => {
      return (
        requiredFields.every((field) => field in route) &&
        Array.isArray(route.routeDirections) &&
        route.routeDirections.every(
          (seg) =>
            typeof seg.id === "string" &&
            Array.isArray(seg.waypoints) &&
            seg.waypoints.length === 2 &&
            typeof seg.state === "string" &&
            ["land", "sea", "air"].includes(seg.state)
        ) &&
        typeof route.totalCost === "number" &&
        typeof route.totalTime === "number" &&
        typeof route.totalDistance === "number" &&
        typeof route.totalCarbonScore === "number" &&
        (route.tag === undefined || route.tag === "popular")
      );
    });
    if (!isValid) {
      return res
        .status(500)
        .json({ error: "AI response contains invalid or missing route data" });
    }

    // Refine numbers to 2 decimal places
    const refinedRoutes = routes.map((route) => ({
      ...route,
      totalCost: Number(route.totalCost.toFixed(2)),
      totalTime: Number(route.totalTime.toFixed(2)),
      totalDistance: Number(route.totalDistance.toFixed(2)),
      totalCarbonScore: Number(route.totalCarbonScore.toFixed(2)),
    }));

    res.json(refinedRoutes);
  } catch (error) {
    console.error("Error in route optimization:", error);
    res.status(500).json({ error: "Failed to generate route optimization" });
  }
});

// Process Routes
router.post("/api/routes", async (req, res) => {
  try {
    const routesData = req.body;
    const responseData = {};

    for (const route of routesData) {
      try {
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

    res.json(responseData);
  } catch (error) {
    console.error("Error processing routes:", error);
    res.status(500).json({ error: "Failed to process routes" });
  }
});

// Save Route
router.post("/api/save-route", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { formData, routeData } = req.body;

    // Validate inputs
    if (!formData || !routeData) {
      return res.status(400).json({ error: "Missing formData or routeData" });
    }

    // Validate formData structure per SaveRoute schema
    if (!formData.from || !formData.to || !formData.weight) {
      return res.status(400).json({
        error: "formData must include from, to, and weight as required fields",
      });
    }

    // Ensure weight is a number
    const weight = Number(formData.weight);
    if (isNaN(weight)) {
      return res.status(400).json({ error: "Weight must be a valid number" });
    }

    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }
    const validatedUserId = new mongoose.Types.ObjectId(userId);

    // Create the record using SaveRoute model
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

module.exports = router;
