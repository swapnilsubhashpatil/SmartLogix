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

    const prompt = `You are a highly intelligent, logistics-aware route optimization AI. Your task is to generate diverse, realistic, and efficient shipping routes between two global locations, precisely estimating distance, cost, time, and environmental impact based on the provided inputs. Ensure all calculations align with real-world logistics data, using reliable sources for distance and cost estimation.

**Inputs Provided**:
- **Origin**: ${from}
- **Destination**: ${to}
- **Package Details**:
  - Quantity: ${quantity}
  - Weight: ${weight} kg
  - Dimensions: ${length}x${width}x${height} cm
- **Description**: ${description}

- **Country codes or vague regions** (e.g., "EU", "FR", "IN"):
        - Replace with a major city in that region/country (e.g., "EU" → "Brussels, Belgium", "FR" → "Paris, France", "IN" → "Mumbai, Maharashtra, India").

**Responsibilities**:
- Determine if the shipment from ${from} to ${to} is domestic (same country) or international (different countries) to select appropriate routing rules.
- Analyze package details (quantity: ${quantity}, weight: ${weight} kg, dimensions: ${length}x${width}x${height} cm) and description ("${description}") to guide route selection and calculations:
  - Quantity (${quantity}) determines if multiple containers or trucks are needed, impacting cost and mode choice. Adjust rates based on quantity: if quantity is 2, double the rate; if 3, triple the rate; and so on (e.g., for quantity ${quantity}, multiply the base rate by ${quantity}).
  - Weight (${weight} kg) drives cost calculations, especially for air freight where weight-based pricing is critical.
  - Dimensions (${length}x${width}x${height} cm) affect volumetric weight for air freight and container requirements for sea freight.
  - Description ("${description}") keywords (e.g., "perishable," "hazardous," "fragile," "urgent") dictate special handling:
    - Perishable/urgent: Prioritize air routes for speed, increasing costs.
    - Hazardous: Select compliant routes, avoiding restricted modes, with surcharges.
    - Fragile: Prefer stable modes (land or sea) to minimize handling risks, and apply carrier guidelines for safe packaging.

**Geographically Valid Waypoints**:
- **Sea**: Use short names for commercial seaports (e.g., "Mumbai Port", "Tokyo Port").
- **Air**: Use short names for international airports (e.g., "DEL Airport", "NRT Airport").
- **Land**: Use logistics hubs or cities (e.g., "Chicago", "Lyon").

**Routing Logic**:
- Generate practical routes from ${from} to ${to} with mode-appropriate waypoints:
  - **Sea legs**: Must be between two seaports (e.g., "Mumbai Port" to "Tokyo Port").
  - **Air legs**: Must be between two airports (e.g., "DEL Airport" to "NRT Airport").
  - **Land legs**: Must be between cities, or between a city and a port/airport (e.g., "Pune" to "DEL Airport", or "Pune" to "Mumbai Port").
- **Transition Rules**:
  - When transitioning from a city to air or sea transport, include a land leg to connect the city to the appropriate airport or seaport.
  - For example, if the route starts in "Pune" and includes an air leg, the first leg must be a land leg from "Pune" to "DEL Airport", followed by an air leg from "DEL Airport" to another airport (e.g., "NRT Airport").
  - Similarly, if the route includes a sea leg, include a land leg from the city to a seaport (e.g., "Pune" to "Mumbai Port"), then a sea leg between seaports.
  - At the destination, include a land leg from the final airport/seaport to the destination city (e.g., "NRT Airport" to "Tokyo").
- **Avoid Invalid Routes**:
  - Do not generate routes where a city connects directly to an airport or seaport via an air or sea leg (e.g., do not create an air leg from "Pune" directly to "NRT Airport").
  - Do not generate consecutive land legs that do not involve a transition to a port or airport (e.g., avoid "Pune" to "Mumbai" via land, then "Mumbai" to "Mumbai Port" via land; instead, go directly from "Pune" to "Mumbai Port" via land).
- For each leg, calculate the distance in km using real-world geographical paths between the waypoints, ensuring the distance is always a positive number greater than 0.

**Distance Calculation**:
- Use reliable sources like the Google Distance Matrix API, OpenStreetMap, or standard geographical databases to calculate distances:
  - For **land routes**, refer to road distances (e.g., the road distance between "Pune" and "DEL Airport" is approximately 1400-1500 km, not 500 km).
  - For **air routes**, use the great-circle distance between airports (e.g., "DEL Airport" to "NRT Airport" is approximately 5830 km).
  - For **sea routes**, use standard maritime distances between ports (e.g., "Mumbai Port" to "Tokyo Port" is approximately 6700 km).
- Cross-verify distances with real-world data to ensure accuracy (e.g., avoid underestimating land distances like 500 km for Pune to Delhi, which should be 1400-1500 km).

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
- **Volumetric Weight Calculation**:
  - Calculate the volumetric weight using the formula: (Length x Width x Height) / 5000 (dimensions in cm, result in kg).
  - Volumetric weight = (${length} x ${width} x ${height}) / 5000 = ${(
      (length * width * height) /
      5000
    ).toFixed(2)} kg.
  - Use the higher of actual weight (${weight} kg) or volumetric weight (${(
      (length * width * height) /
      5000
    ).toFixed(2)} kg) for cost calculations.
- **Distance**:
  - For each leg in the routeDirections, calculate the specific distance between the waypoints in km using real-world geographical paths.
  - Ensure each leg's distance is a positive number greater than 0 (e.g., the distance between "Pune" and "DEL Airport" should be 1400-1500 km by road).
- **Cost (USD)**:
  - Use the higher of actual weight (${weight} kg) or volumetric weight (${(
      (length * width * height) /
      5000
    ).toFixed(2)} kg) to calculate base costs based on DHL and Freightos rates.
  - Adjust costs based on quantity (${quantity}): multiply the base cost by ${quantity} (e.g., if quantity is 2, double the cost; if 3, triple the cost).
  - Note that air rates are higher than sea rates:
    - **Land**:
      - Domestic: $0.5-$2/kg/km, adjusted for quantity (${quantity}) and route demand.
      - International: $1.5-$3/kg/km, reflecting cross-border logistics.
      - For quantity (${quantity}) exceeding truck capacity, apply full truckload (FTL) rates (e.g., $1.20-$2.50/km) or less than truckload (LTL) rates ($40-$100/ton for ≤500 km).
      - Add 20% surcharge for hazardous, perishable, or fragile cargo from "${description}".
    - **Air** (higher rates than sea):
      - Base on the higher of actual weight (${weight} kg) or volumetric weight, using DHL air freight rates ($5-$15/kg for standard, $8-$20/kg for express).
      - Add 20% surcharge for special handling (e.g., perishable, hazardous, fragile) from "${description}".
    - **Sea** (lower rates than air):
      - Use Freightos container rates: $1000-$5000 for 20-ft FCL, $1500-$8000 for 40-ft FCL, or $1-$5/kg for LCL, adjusted for distance and route popularity.
      - For quantity (${quantity}), calculate if multiple containers are needed based on dimensions (${length}x${width}x${height} cm).
      - Add 20% surcharge for special handling from "${description}".
  - **Cost-Saving Strategies**:
    - Consider efficient packaging to minimize volumetric weight (e.g., use the smallest possible box for the item).
    - Account for discounted shipping rates based on volume (e.g., apply a 10-20% discount on rates for high-volume shipments).
- **Time (hours)**:
  - Calculate totalTime in hours as the sum of the time for each leg:
    - Land: Domestic: (distance/60) + 6; International: (distance/60) + 18.
    - Air: Domestic: 12-24; International: 48-72 (2-3 days).
    - Sea: Short to medium-haul (e.g., within Asia or Europe): 192-216 hours (8-9 days); Long-haul (e.g., Asia to North America): 600-1080 hours (25-45 days).
    - Add 10% time for special cargo (e.g., hazardous, fragile) from "${description}".
  - For totalTimeDaysRange, convert the totalTime (in hours) to a days range:
    - Divide totalTime by 24 to get the number of days (e.g., 48 hours / 24 = 2 days).
    - If totalTime falls within a predefined range (e.g., 48-72 hours), use the corresponding days range (e.g., "2-3 days").
    - Examples:
      - 48-72 hours → "2-3 days"
      - 192-216 hours → "8-9 days"
      - 600-1080 hours → "25-45 days"
- **Carbon Score (0-100)**:
  - Air: 70-100 (high emissions).
  - Sea: 20-40 (low emissions).
  - Land: 40-60 (medium emissions).
  - Adjust based on distance, the higher of weight (${weight} kg) or volumetric weight, and mode mix, normalized across routes.

**Validation**:
- Recheck routes for realism:
  - Ensure waypoints match modes (e.g., sea legs use ports like "Mumbai Port", air legs use airports like "DEL Airport").
  - Verify distances align with geographical paths from ${from} to ${to}, using sources like Google Distance Matrix API (e.g., Pune to DEL Airport should be 1400-1500 km by road), and each leg distance is greater than 0.
  - Confirm costs reflect DHL and Freightos rates, adjusted for the higher of actual or volumetric weight, package dimensions (${length}x${width}x${height} cm), quantity (${quantity}), and special handling from "${description}".
  - Ensure times align with updated ranges (e.g., air at 2-3 days, sea at 8-9 days for short to medium hauls), and carbon scores align with industry norms and package requirements.
- Adjust any outliers to maintain consistency with real-world logistics data (e.g., correct underestimated distances like 500 km for Pune to Delhi).

**Tagging Popular Routes**:
- Tag three routes as "popular" based on package details (quantity: ${quantity}, weight: ${weight} kg, dimensions: ${length}x${width}x${height} cm) and description ("${description}"):
  - One with the lowest totalCost, optimized for the higher of weight or volumetric weight and any special handling.
  - One with the shortest totalTime, prioritizing speed if "${description}" indicates urgency.
  - One with the lowest totalCarbonScore, favoring eco-friendly options.
- If overlap occurs, select the next best distinct route to ensure diversity.

**Constraints**:
- No duplicate routes; ensure operational and geographical validity.
- Do not alter origin (${from}) or destination (${to}).

**Output Format**:
- Return only a JSON array of route objects:
  - "routeDirections": Array of { "id": "unique-string", "waypoints": ["start", "end"], "state": "land" | "sea" | "air", "distance": number (km) }
  - "totalCost": number (USD)
  - "totalTime": number (hours)
  - "totalTimeDaysRange": string (e.g., "2-3 days")
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
