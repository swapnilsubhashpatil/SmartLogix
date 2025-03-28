const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
const cors = require("cors");
const axios = require("axios");
app.use(cors());
app.use(express.json());
const bodyParser = require("body-parser");

app.use(bodyParser.json());
const GOOGLE_API_KEY = "AIzaSyAuVwzksyAl-eATP99mxACJq1Z1MLOscZc";

app.post("/api/route-optimization", async (req, res) => {
  try {
    const { from, to, weight } = req.body;

    if (!from || !to || !weight) {
      return res
        .status(400)
        .json({ error: "Missing required fields: from, to, and weight" });
    }

    const GOOGLE_API_KEY = "AIzaSyAuVwzksyAl-eATP99mxACJq1Z1MLOscZc"; // Ensure this is set in your environment
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `
      You are a route optimization AI designed to generate optimal shipping routes between two locations considering various factors. Your task is to provide 9 routes categorized into 3 popular routes, 3 cost-efficient routes, and 3 time-efficient routes based on the provided origin, destination, and shipment weight. Use realistic logistics data and calculations.

      **Inputs**:
      - Origin: ${from}
      - Destination: ${to}
      - Shipment Weight: ${weight} kg

      **Requirements**:
      - Generate exactly 9 routes: 3 popular, 3 cost-efficient, and 3 time-efficient.
      - Each route must consist of 1-3 waypoints in the format:
        { id: "string", waypoints: ["string", "string"], state: "land" | "sea" | "air" }
      - For each route, calculate:
        - totalCost (in USD, considering weight and distance)
        - totalTime (in hours)
        - totalDistance (in kilometers)
        - totalCarbonEmission (in kg CO2, based on transport mode and distance)
      - Use realistic values based on:
        - Land: $0.1/kg/km, 50 km/h, 0.062 kg CO2/km
        - Sea: $0.05/kg/km, 30 km/h, 0.008 kg CO2/km
        - Air: $0.5/kg/km, 800 km/h, 0.53 kg CO2/km
      - Ensure waypoints make geographical sense between origin and destination.

      **Output Rules**:
      - Return a strictly JSON-formatted response with no extra text outside the JSON.
      - Format:
        {
          "popularRoutes": [
            {
              "routeDirections": [{ "id": "string", "waypoints": ["string", "string"], "state": "land" | "sea" | "air" }],
              "totalCost": number,
              "totalTime": number,
              "totalDistance": number,
              "totalCarbonEmission": number
            }
          ],
          "costEfficientRoutes": [{ ... }],
          "timeEfficientRoutes": [{ ... }]
        }
      - Numbers should be rounded to 2 decimal places.

      **Example Calculation**:
      - Route: Mumbai → Bangalore (land, 1000 km)
      - Weight: 100 kg
      - totalCost = 1000 km * 0.1 * 100 = $10,000
      - totalTime = 1000 km / 50 = 20 hours
      - totalCarbonEmission = 1000 * 0.062 = 62 kg CO2
    `;

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    // Extract and validate JSON
    const jsonStart = rawResponse.indexOf("{");
    const jsonEnd = rawResponse.lastIndexOf("}") + 1;
    const jsonResponse = rawResponse.slice(jsonStart, jsonEnd).trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return res.status(500).json({ error: "Invalid response format from AI" });
    }

    // Validate response structure
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
      return res.status(500).json({
        error: "AI response missing required route categories or count",
      });
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error("Error in route optimization:", error);
    res.status(500).json({ error: "Failed to generate route optimization" });
  }
});

const GOOGLE_MAPS_API_KEY = "AIzaSyAmyeWi4SPcXM7dkR1hduoIqL5uyMXtqUk";

async function geocodeAddress(address) {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: address,
          key: GOOGLE_MAPS_API_KEY,
        },
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

    // Add intermediate waypoints if there are any
    if (waypointsLatLng.length > 2) {
      requestData.intermediates = waypointsLatLng.slice(1, -1).map((point) => ({
        location: {
          latLng: {
            latitude: point.lat,
            longitude: point.lng,
          },
        },
      }));
    }

    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
    };

    const response = await axios.post(routesApiUrl, requestData, { headers });

    if (
      !response.data ||
      !response.data.routes ||
      response.data.routes.length === 0
    ) {
      throw new Error("No routes found");
    }

    return response.data.routes[0].polyline.encodedPolyline;
  } catch (error) {
    console.error("Error getting directions:", error);
    throw error;
  }
}

app.post("/api/routes", async (req, res) => {
  try {
    const routesData = req.body;
    const responseData = {};

    for (const route of routesData) {
      try {
        if (route.state === "land") {
          const encodedPolyline = await getDirections(route.waypoints);
          responseData[route.id] = {
            encodedPolyline,
            state: route.state,
          };
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

    // Improved JSON extraction
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

app.listen(3003, () => {
  console.log("Server running on port 3003");
});
