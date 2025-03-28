const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose"); // Import mongoose
const app = express();
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const SaveRoute = require("./Database/saveRouteSchema"); // Adjust path
const connectMongoDB = require("./Database/connectDB");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "mySuperSecretKey12345!@";
const GOOGLE_API_KEY = "AIzaSyAuVwzksyAl-eATP99mxACJq1Z1MLOscZc";
const GOOGLE_MAPS_API_KEY = "AIzaSyAmyeWi4SPcXM7dkR1hduoIqL5uyMXtqUk";

// Connect to MongoDB
connectMongoDB();

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log("Token verified for user:", decoded);
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

// Route Optimization Endpoint
app.post("/api/route-optimization", async (req, res) => {
  try {
    const { from, to, weight } = req.body;

    if (!from || !to || !weight) {
      return res
        .status(400)
        .json({ error: "Missing required fields: from, to, and weight" });
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Updated to valid model

    const prompt = `
      You are a route optimization AI designed to generate optimal shipping routes between two locations, using realistic logistics data and real-world considerations. Your task is to provide 9 routes categorized into 3 popular routes, 3 cost-efficient routes, and 3 time-efficient routes based on the provided origin, destination, and shipment weight.

      **Inputs**:
      - Origin: ${from}
      - Destination: ${to}
      - Shipment Weight: ${weight} kg

      **Requirements**:
      - Generate exactly 9 routes: 3 popular, 3 cost-efficient, and 3 time-efficient.
      - Each route must consist of 2 to 5 waypoints (inclusive), representing realistic checkpoints between origin and destination.
      - Waypoints must be actual cities or locations with geographical relevance to the route.
      - For each segment between waypoints, specify the transport mode in the format:
        { id: "string", waypoints: ["string", "string"], state: "land" | "sea" | "air" }
      - Verify port or airport existence:
        - For "sea" routes, ensure waypoints have functional seaports (e.g., Mumbai has a port, but an inland city like Delhi does not).
        - For "air" routes, ensure waypoints have operational airports.
      - Multi-segment routes:
        - If a route uses the same mode consecutively (e.g., sea from Mumbai to Singapore, then sea to Japan), explicitly list each segment with its own waypoints and state.
      - Calculate for each route:
        - totalCost (in USD, based on realistic cost rates below, considering weight and distance)
        - totalTime (in hours, based on realistic speeds below, including transfer times)
        - totalDistance (in kilometers, estimated realistically between waypoints)
        - totalCarbonEmission (in kg CO2, based on transport mode and distance)
      - Use these realistic values:
        - Land: $0.15/kg/km, 60 km/h, 0.07 kg CO2/km, add 2 hours per waypoint for loading/unloading
        - Sea: $0.08/kg/km, 40 km/h, 0.01 kg CO2/km, add 12 hours per waypoint for port handling
        - Air: $0.75/kg/km, 900 km/h, 0.60 kg CO2/km, add 3 hours per waypoint for airport processing
      - Ensure distances and times reflect real-world geography (e.g., use approximate great-circle distances between cities).
      - For cost-efficient routes, sort them in ascending order by totalCost (low to high).

      **Output Rules**:
      - Return a strictly JSON-formatted response with no extra text outside the JSON.
      - Format:
        {
          "popularRoutes": [
            {
              "routeDirections": [
                { "id": "string", "waypoints": ["string", "string"], "state": "land" | "sea" | "air" }
              ],
              "totalCost": number,
              "totalTime": number,
              "totalDistance": number,
              "totalCarbonEmission": number
            }
          ],
          "costEfficientRoutes": [
            { ... } // Sorted by totalCost, ascending
          ],
          "timeEfficientRoutes": [{ ... }]
        }
      - Numbers must be rounded to 2 decimal places.
      - Ensure waypoints make geographical sense and align with the transport mode (e.g., sea routes only between port cities).
    `;

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    const jsonStart = rawResponse.indexOf("{");
    const jsonEnd = rawResponse.lastIndexOf("}") + 1;
    const jsonResponse = rawResponse.slice(jsonStart, jsonEnd).trim();

    let parsedResponse = JSON.parse(jsonResponse);
    const requiredFields = [
      "popularRoutes",
      "costEfficientRoutes",
      "timeEfficientRoutes",
    ];
    const hasAllFields = requiredFields.every(
      (field) =>
        Array.isArray(parsedResponse[field]) &&
        parsedResponse[field].length === 3
    );

    if (!hasAllFields) {
      return res
        .status(500)
        .json({ error: "AI response missing required fields" });
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error("Error in route optimization:", error);
    res.status(500).json({ error: "Failed to generate route optimization" });
  }
});

// Geocode Address Helper
async function geocodeAddress(address) {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: { address, key: GOOGLE_MAPS_API_KEY },
      }
    );

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      throw new Error(`Geocoding failed for address: ${address}`);
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
}

// Get Directions Helper
async function getDirections(waypoints) {
  try {
    const waypointsLatLng = await Promise.all(waypoints.map(geocodeAddress));
    const routesApiUrl =
      "https://routes.googleapis.com/directions/v2:computeRoutes";
    const requestData = {
      origin: {
        location: {
          latLng: {
            latitude: waypointsLatLng[0].lat,
            longitude: waypointsLatLng[0].lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: waypointsLatLng[waypointsLatLng.length - 1].lat,
            longitude: waypointsLatLng[waypointsLatLng.length - 1].lng,
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
      languageCode: "en-US",
      units: "IMPERIAL",
    };

    if (waypointsLatLng.length > 2) {
      requestData.intermediates = waypointsLatLng.slice(1, -1).map((point) => ({
        location: { latLng: { latitude: point.lat, longitude: point.lng } },
      }));
    }

    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
    };

    const response = await axios.post(routesApiUrl, requestData, { headers });
    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error("No routes found");
    }
    return response.data.routes[0].polyline.encodedPolyline;
  } catch (error) {
    console.error("Error getting directions:", error);
    throw error;
  }
}

// Routes Endpoint
app.post("/api/routes", async (req, res) => {
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

// Save Route Endpoint
app.post("/api/save-route", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { formData, routeData } = req.body;

    console.log("Saving route for userId:", userId);
    console.log("Received formData:", formData);
    console.log("Received routeData:", routeData);

    // Validate inputs
    if (!formData || !routeData) {
      console.log("Validation failed: Missing formData or routeData");
      return res.status(400).json({ error: "Missing formData or routeData" });
    }

    // Validate formData structure per SaveRoute schema
    if (!formData.from || !formData.to || !formData.weight) {
      console.log("Validation failed: Incomplete formData");
      return res.status(400).json({
        error: "formData must include from, to, and weight as required fields",
      });
    }

    // Ensure weight is a number
    const weight = Number(formData.weight);
    if (isNaN(weight)) {
      console.log("Validation failed: Weight must be a number");
      return res.status(400).json({ error: "Weight must be a valid number" });
    }

    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Validation failed: Invalid userId format");
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

    console.log(
      "Route record saved successfully for user ID:",
      userId,
      "Record ID:",
      saveRoute._id
    );
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

// Fetch Route History Endpoint
app.get("/api/route-history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Fetching route history for userId:", userId);

    const routeHistory = await SaveRoute.find({ userId }).sort({
      timestamp: -1,
    }); // Newest first

    console.log("Route history retrieved:", routeHistory.length, "records");
    res.json({ routeHistory });
  } catch (error) {
    console.error("Error fetching route history:", error.stack);
    res.status(500).json({
      error: "Failed to fetch route history",
      details: error.message,
    });
  }
});

// Carbon Footprint Endpoint
app.post("/api/carbon-footprint", async (req, res) => {
  try {
    const { origin, destination, distance, vehicleType, weight } = req.body;

    if (!origin || !destination || !distance || !vehicleType || !weight) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const prompt = `
        You are a carbon footprint analysis AI for Movex. Based on the following inputs, provide a structured response in JSON format with proper keys and values.
  
        Inputs:
        - Origin: ${origin}
        - Destination: ${destination}
        - Distance: ${distance} km
        - Vehicle Type: ${vehicleType}
        - Weight: ${weight} kg
  
        Response Format (JSON):
        {
          "totalDistance": "Distance in kilometers with unit (e.g., '1347.2 km')",
          "totalEmissions": "Total CO2e emissions in kg with unit (e.g., '1500 kg CO2e')",
          "routeAnalysis": [
            {
              "leg": "Leg number (e.g., 'Leg 1')",
              "origin": "Origin location",
              "destination": "Destination location",
              "distance": "Distance for this leg with unit (e.g., '1347.2 km')",
              "fuelConsumption": "Fuel consumption in liters with unit (e.g., '500 L')",
              "fuelType": "Type of fuel used (e.g., 'Diesel')",
              "emissions": {
                "total": "Total CO2e emissions in kg with unit (e.g., '1500 kg CO2e')",
                "intensity": "Emission intensity in gCO2e/tonne-km with unit (e.g., '111.4 gCO2e/tonne-km')",
                "breakdown": {
                  "tankToWheel": "Tank to wheel emissions in kg CO2e with unit (e.g., '1200 kg CO2e')",
                  "wellToTank": "Well to tank emissions in kg CO2e with unit (e.g., '300 kg CO2e')"
                }
              },
              "cost": "Estimated cost in INR with unit (e.g., '25000 INR')"
            }
          ],
          "suggestions": [
            "Suggestion 1 for reducing emissions",
            "Suggestion 2 for alternative routes or vehicle types"
          ],
          "additionalInsights": [
            "Insight 1 about the route or emissions",
            "Insight 2 about optimization",
            "Insight 3 about future considerations"
          ]
        }
      `;

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    console.log("Raw Response:", rawResponse);

    const jsonMatch = rawResponse.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }
    const cleanResponseText = jsonMatch[0];
    const responseData = JSON.parse(cleanResponseText);

    res.json(responseData);
  } catch (error) {
    console.error("Error in carbon footprint endpoint:", error);
    res.status(500).json({
      error: "Failed to generate carbon footprint analysis",
      details: error.message,
    });
  }
});

// Start Server
app.listen(3003, () => {
  console.log("Server running on port 3003");
});
