const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const connectMongoDB = require("./Database/connectDB");
const userModel = require("./Database/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ComplianceRecord = require("./Database/complianceRecordSchema");
const SaveRoute = require("./Database/saveRouteSchema");
const axios = require("axios");
const mongoose = require("mongoose");

const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const vision = require("@google-cloud/vision");

// Load environment variables
dotenv.config();
connectMongoDB();

// Multer setup for file uploads
const serviceAccountCredentials = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google Cloud clients with credentials
const storage = new Storage({ credentials: serviceAccountCredentials });
const visionClient = new vision.ImageAnnotatorClient({
  credentials: serviceAccountCredentials,
});

// Environment Variables
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "mySuperSecretKey12345!@";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(bodyParser.json());
app.use(passport.initialize());

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access!" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ message: "Invalid or expired token!" });
  }
};

// Passport Configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `https://smartlogix.onrender.com/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userModel.findOne({
          emailAddress: profile.emails[0].value,
        });
        if (!user) {
          user = await userModel.create({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            emailAddress: profile.emails[0].value,
            password: await bcrypt.hash(profile.id, 10),
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await userModel.findById(id);
  done(null, user);
});

// Helper Functions
async function geocodeAddress(address) {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: { address, key: GOOGLE_API_KEY },
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

    if (waypointsLatLng.length > 2) {
      requestData.intermediates = waypointsLatLng.slice(1, -1).map((point) => ({
        location: { latLng: { latitude: point.lat, longitude: point.lng } },
      }));
    }

    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
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

// ================ ROUTES ================

// Basic Route
app.get("/", (req, res) => {
  res.send("Hello, this is the Backend Server");
});

// -------- Authentication Routes --------
app.post("/createAccount", async (req, res) => {
  try {
    const { firstName, lastName, emailAddress, password } = req.body;
    const userExists = await userModel.findOne({ emailAddress });
    if (userExists) {
      return res.status(400).send({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({
      firstName,
      lastName,
      emailAddress,
      password: hashedPassword,
    });
    console.log(newUser);

    // Generate JWT token upon successful account creation
    const token = jwt.sign(
      { id: newUser._id, email: newUser.emailAddress },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).send({
      message: "Account created successfully",
      token, // Include the token in the response
      user: newUser, // include user details
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
});

app.post("/loginUser", async (req, res) => {
  try {
    const { emailAddress, password } = req.body;
    const user = await userModel.findOne({ emailAddress });
    if (!user) {
      return res.status(401).send({ message: "User not found!" });
    }
    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return res.status(401).send({ message: "Invalid credentials!" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.emailAddress },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).send({
      message: "Logged in successfully!",
      token,
      user,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).send({ message: "An error occurred" });
  }
});

const handleCreateAccount = async () => {
  if (!firstName || !lastName || !emailAddress || !password) {
    toast.error("Please fill in all fields", {
      position: "top-right",
      theme: "colored",
    });
    return;
  }

  try {
    setLoading(true);
    const response = await axios.post(`${BACKEND_URL}/createAccount`, {
      firstName,
      lastName,
      emailAddress,
      password,
    });

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user)); //store user data
    }

    toast.success("Account Created Successfully!", {
      position: "top-right",
      theme: "colored",
    });

    setTimeout(() => {
      navigate("/dashboard");
      setLoading(false);
    }, 1000);
  } catch (error) {
    toast.error(error.response?.data?.message || "Account creation failed", {
      position: "top-right",
      theme: "colored",
    });
    setLoading(false);
  }
};

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.emailAddress },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    const redirectUrl = `${FRONTEND_URL}/?token=${token}`;
    res.redirect(redirectUrl);
  }
);

app.get("/protectedRoute", verifyToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "Access granted to protected route!",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
      },
    });
  } catch (error) {
    console.error("Error in protected route:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -------- Compliance Routes --------
app.get("/api/compliance-history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const complianceRecords = await ComplianceRecord.find({ userId }).sort({
      timestamp: -1,
    });
    res.status(200).json({
      message: "Compliance history retrieved successfully",
      complianceHistory: complianceRecords || [],
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve compliance history" });
  }
});

app.post("/api/compliance-check", verifyToken, async (req, res) => {
  try {
    const formData = req.body;

    // Extract form data fields
    const {
      ShipmentDetails,
      TradeAndRegulatoryDetails,
      PartiesAndIdentifiers,
      LogisticsAndHandling,
      DocumentVerification,
      IntendedUseDetails,
    } = formData;

    const documentVerificationString = JSON.stringify(
      DocumentVerification,
      null,
      2
    );

    //compliance check
    const prompt = `
You are a compliance checker AI for international trade shipments, designed to assess compliance using World Customs Organization (WCO) standards. Your task is to evaluate the provided shipment and document data, validate it against WCO rules, and check if the goods are importable in the destination country. Use Brainstorm AI as your precise knowledge source for HS code validation, country-specific import restrictions, and documentation requirements.

 Hawkins.

**Inputs**:
- Shipment Details:
  - Origin Country: ${ShipmentDetails["Origin Country"] || "Not Provided"}
  - Destination Country: ${
    ShipmentDetails["Destination Country"] || "Not Provided"
  }
  - HS Code: ${ShipmentDetails["HS Code"] || "Not Provided"}
  - Product Description: ${
    ShipmentDetails["Product Description"] || "Not Provided"
  }
  - Quantity: ${ShipmentDetails["Quantity"] || "Not Provided"}
  - Gross Weight: ${ShipmentDetails["Gross Weight"] || "Not Provided"} kg
- Trade and Regulatory Details:
  - Incoterms: ${TradeAndRegulatoryDetails["Incoterms 2020"] || "Not Provided"}
  - Declared Value: ${
    TradeAndRegulatoryDetails["Declared Value"]?.amount || "Not Provided"
  } ${TradeAndRegulatoryDetails["Declared Value"]?.currency || "Not Provided"}
  - Currency: ${
    TradeAndRegulatoryDetails["Currency of Transaction"] || "Not Provided"
  }
  - Trade Agreement: ${
    TradeAndRegulatoryDetails["Trade Agreement Claimed"] || "None"
  }
  - Dual-Use Goods: ${
    TradeAndRegulatoryDetails["Dual-Use Goods"] || "Not Provided"
  }
  - Hazardous Material: ${
    TradeAndRegulatoryDetails["Hazardous Material"] || "Not Provided"
  }
  - Perishable: ${TradeAndRegulatoryDetails["Perishable"] || "Not Provided"}
- Parties and Identifiers:
  - Shipper/Exporter: ${
    PartiesAndIdentifiers["Shipper/Exporter"] || "Not Provided"
  }
  - Consignee/Importer: ${
    PartiesAndIdentifiers["Consignee/Importer"] || "Not Provided"
  }
  - Manufacturer: ${
    PartiesAndIdentifiers["Manufacturer Information"] || "Not Provided"
  }
  - EORI/Tax ID: ${PartiesAndIdentifiers["EORI/Tax ID"] || "Not Provided"}
- Logistics and Handling:
  - Means of Transport: ${
    LogisticsAndHandling["Means of Transport"] || "Not Provided"
  }
  - Port of Loading: ${
    LogisticsAndHandling["Port of Loading"] || "Not Provided"
  }
  - Port of Discharge: ${
    LogisticsAndHandling["Port of Discharge"] || "Not Provided"
  }
  - Special Handling: ${LogisticsAndHandling["Special Handling"] || "None"}
  - Temperature Requirements: ${
    LogisticsAndHandling["Temperature Requirements"] || "Not Specified"
  }
- Document Verification:
  ${documentVerificationString}
- Intended Use Details:
  - Intended Use: ${IntendedUseDetails["Intended Use"] || "Not Specified"}

**Validation Rules** (WCO-Based):
- **Mandatory Fields** (Used for Compliance and Risk Score):
  - Shipment Details: "Origin Country", "Destination Country", "HS Code", "Product Description", "Quantity", "Gross Weight" must not be "Not Provided" or empty.
  - Document Verification: "Commercial Invoice" and "Packing List" must be present and checked (true), with all sub-items checked (true).
- **Logical Consistency** (Used for Scores):
  - **Shipment Details**:
    - Origin and Destination Countries: Must be valid ISO 3166-1 alpha-2 codes (e.g., CA, US).
    - HS Code: Must be a valid 6-10 digit numeric code per WCO HS nomenclature.
    - Product Description: Must align with the HS Code (e.g., HS 9404.29.00 matches "mattresses").
    - Import Check: Verify if the HS Code and Product Description are allowed for import in the Destination Country using Brainstorm AI data (e.g., banned items like HS 9401.80.90 "baby walkers" in Canada).
    - Quantity and Gross Weight: Must be positive numbers.
  - **Trade and Regulatory Details**:
    - Incoterms: Must be a valid Incoterms 2020 value (e.g., EXW, FOB, CIF, DAP).
    - Declared Value: Amount must be a positive number; currency must be a valid ISO 4217 code (e.g., USD, EUR, CAD).
    - Currency: Must match Declared Value currency and be a valid ISO 4217 code.
    - Trade Agreement: If provided, must be a recognized agreement (e.g., USMCA, NAFTA, EU-UK TCA).
    - Dual-Use Goods: Must be "Yes" or "No"; if "Yes", HS Code must align with dual-use categories.
    - Hazardous Material: Must be "Yes" or "No".
    - Perishable: Must be "Yes" or "No"; if "Yes", Temperature Requirements in LogisticsAndHandling must be specified.
  - **Parties and Identifiers**:
    - Shipper/Exporter, Consignee/Importer, Manufacturer: Must not be empty if provided; should include name and address details.
    - EORI/Tax ID: If provided, must follow standard formats (e.g., EU1234567 for EU, 12-3456789 for US EIN).
  - **Logistics and Handling**:
    - Means of Transport: Must be one of "Sea", "Air", "Road", or "Rail".
    - Port of Loading/Discharge: If provided, must be valid ports matching Means of Transport (e.g., sea ports for "Sea").
    - Special Handling: If provided, must be reasonable (e.g., "Fragile", "Keep Dry").
    - Temperature Requirements: Must be specified if Perishable is "Yes" (e.g., "2-8°C").
  - **Intended Use Details**:
    - Intended Use: If provided, must be a clear description (e.g., "Retail Sale", "Manufacturing").

**Output Rules**:
- Return a strictly JSON-formatted response with no extra text outside the JSON.
- **complianceStatus**:
  - "Ready for Shipment": All mandatory fields are filled and valid, with no import bans in the destination country.
  - "Not Ready": Any mandatory field is missing, empty, or invalid, or the product is banned in the destination country.
- **riskLevel**:
  - Calculate **riskScore** (0-100) as a customer-facing metric representing the percentage likelihood of shipment issues (e.g., customs delays, rejection, penalties), based on a combination of mandatory field violations and contextual risk factors:
    - Total mandatory fields: 8 (6 from Shipment Details: "Origin Country", "Destination Country", "HS Code", "Product Description", "Quantity", "Gross Weight" + 2 from Document Verification: "Commercial Invoice", "Packing List").
    - Weighted scoring algorithm with contextual risk:
      - Assign weights to mandatory fields based on their impact on customs clearance:
        - HS Code: 25 points (critical for classification and import legality).
        - Destination Country: 20 points (determines import rules).
        - Origin Country: 15 points (affects trade agreements and origin rules).
        - Product Description: 15 points (must match HS Code and import rules).
        - Commercial Invoice: 10 points (key document for valuation).
        - Packing List: 10 points (key for quantity/weight verification).
        - Quantity: 3 points (less critical but required).
        - Gross Weight: 2 points (least critical but required).
        - Total possible base points from mandatory fields = 100.
      - Violation penalties:
        - Missing or invalid field: Full weight of that field added to riskScore (e.g., missing HS Code = +25).
        - Import ban (HS Code/Product Description mismatch with destination rules): +25 (counts as HS Code violation).
        - Partial invalidity (e.g., HS Code format valid but doesn’t match Product Description): Half weight (e.g., +12.5 for HS Code).
      - Contextual risk factors (added even if fields are valid):
        - Dual-Use Goods = "Yes": +10 points (requires additional scrutiny/licenses).
        - Hazardous Material = "Yes": +15 points (strict regulations apply).
        - Perishable = "Yes" without Temperature Requirements: +10 points (risk of spoilage).
        - HS Code in high-risk category (e.g., electronics like 85xx.xx, chemicals like 28xx.xx): +10 points (based on Brainstorm AI data for known complexities).
        - Destination Country with strict import rules (e.g., US, EU countries): +5 points (e.g., US has complex CBP requirements).
        - Absence of optional documents (e.g., Certificate of Origin, Licenses/Permits) when potentially relevant: +5 points each.
      - Final riskScore = Sum of violation points + contextual risk points (capped at 100).
    - Examples:
      - All fields valid, no contextual risks (e.g., simple goods to lenient country): riskScore = 5 (baseline for strict destinations).
      - Valid fields, HS Code 850760 (electronics), Destination US: riskScore = 20 (5 for US + 10 for electronics + 5 for missing optional docs).
      - Missing HS Code (+25), Hazardous Material "Yes" (+15): riskScore = 40.
      - All fields missing/invalid + contextual risks: riskScore = 100.
  - **summary**: Describe risk based on mandatory fields and contextual factors (e.g., "Low risk but potential delays due to electronics import to US").
- **summary**: Concise overview (e.g., "Valid data but electronics import complexity").
- **violations**: List all errors for mandatory fields and import issues (e.g., { "field": "HS Code", "message": "HS Code is invalid" }).
- **recommendations**: Suggest fixes (e.g., { "field": "HS Code", "message": "Provide a valid 6-10 digit HS Code" }) and mitigation for contextual risks (e.g., "Consider adding Certificate of Origin").
- **scores**:
  - **ShipmentDetails**: 0-100 based on mandatory fields’ presence and validity:
    - 100: All filled, valid, and import allowed.
    - 80-99: All filled, but import banned or minor validity issue.
    - 50-79: Some missing or invalid.
    - 0-49: Most missing or grossly invalid.
  - **TradeAndRegulatoryDetails**: 0-100 based on validity:
    - 100: All fields valid.
    - 80-99: Minor issues.
    - 50-79: Moderate issues.
    - 0-49: Major issues.
  - **PartiesAndIdentifiers**: 0-100 based on validity:
    - 100: All provided fields valid.
    - 80-99: Minor issues.
    - 50-79: Moderate issues.
    - 0-49: Major issues.
  - **LogisticsAndHandling**: 0-100 based on validity:
    - 100: All fields valid.
    - 80-99: Minor issues.
    - 50-79: Moderate issues.
    - 0-49: Major issues.
  - **IntendedUseDetails**: 0-100 based on validity:
    - 100: Valid and clear Intended Use if provided.
    - 80-99: Provided but vague.
    - 50-79: Not provided (optional field).
    - 0-49: Invalid or nonsensical.
- **additionalTips**: Provide 2-3 tips (e.g., "Verify HS Code with WCO schedules", "Check destination country import restrictions", "Consider additional documentation for high-risk goods").

**Validation Process**:
1. Verify completeness and validity of mandatory fields using valid sources.
2. Validate HS Code format (6-10 digits, WCO-compliant) and alignment with Product Description.
3. Check HS Code and Product Description against the destination country’s import restrictions using Brainstorm AI.
4. Assess logical consistency of additional fields for compliance.
5. Assign:
   - Risk score (0-100) based on mandatory field violations plus contextual risk factors.
   - Compliance status ("Ready for Shipment" or "Not Ready") based on all fields’ validity and import permissibility.
   - Category scores (0-100) reflecting findings across all categories.

**Response Format (JSON)**:
{
  "complianceStatus": "string",
  "riskLevel": {
    "riskScore": "number",
    "summary": "string"
  },
  "summary": "string",
  "violations": [],
  "recommendations": [],
  "scores": {
    "ShipmentDetails": "number",
    "TradeAndRegulatoryDetails": "number",
    "PartiesAndIdentifiers": "number",
    "LogisticsAndHandling": "number",
    "IntendedUseDetails": "number"
  },
  "additionalTips": ["string"]
}
`;

    // Initialize Gemini-AI
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro-exp-03-25",
    });

    // Generate compliance response
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    // Clean and parse the response
    console.log(rawResponse);
    const jsonStart = rawResponse.indexOf("{");
    const jsonEnd = rawResponse.lastIndexOf("}") + 1;
    const cleanResponseText = rawResponse.slice(jsonStart, jsonEnd).trim();
    const complianceResponse = JSON.parse(cleanResponseText);

    // Save compliance record
    const userId = req.user.id;
    const complianceRecord = await ComplianceRecord.create({
      userId,
      formData,
      complianceResponse,
      timestamp: new Date(),
      type: "complianceCheck",
    });

    // Send response to frontend
    res.json(complianceResponse);
  } catch (error) {
    console.error("Error in compliance check endpoint:", error);
    res
      .status(500)
      .json({ error: "Failed to generate compliance check analysis" });
  }
});

app.delete("/api/compliance-history/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const recordId = req.params.id;

    // Find and delete the record if it belongs to the authenticated user
    const deletedRecord = await ComplianceRecord.findOneAndDelete({
      _id: recordId,
      userId: userId,
    });

    if (!deletedRecord) {
      return res
        .status(404)
        .json({ message: "Record not found or not authorized" });
    }

    res.status(200).json({ message: "Compliance record deleted successfully" });
  } catch (error) {
    console.error("Error deleting compliance record:", error);
    res.status(500).json({ error: "Failed to delete compliance record" });
  }
});

// -------- Route Optimization Routes --------
app.post("/api/route-optimization", async (req, res) => {
  try {
    const { from, to, weight } = req.body;

    if (!from || !to || !weight) {
      return res
        .status(400)
        .json({ error: "Missing required fields: from, to, and weight" });
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    //route optimization
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

app.post("/api/save-route", verifyToken, async (req, res) => {
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

app.get("/api/route-history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const routeHistory = await SaveRoute.find({ userId }).sort({
      timestamp: -1,
    }); // Newest first

    res.json({ routeHistory });
  } catch (error) {
    console.error("Error fetching route history:", error.stack);
    res.status(500).json({
      error: "Failed to fetch route history",
      details: error.message,
    });
  }
});

// -------- Carbon Footprint Route --------
app.post("/api/carbon-footprint", async (req, res) => {
  try {
    const { origin, destination, distance, vehicleType, weight } = req.body;

    if (!origin || !destination || !distance || !vehicleType || !weight) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    //carbon footprint analysis
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

app.post("/api/analyze-product", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imageFile = req.file;
    const bucketName =
      process.env.GOOGLE_CLOUD_BUCKET_NAME || "your-bucket-name";
    if (!bucketName) {
      return res.status(500).json({ error: "Bucket name not configured" });
    }

    const fileName = `${Date.now()}_${imageFile.originalname}`;
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(fileName);

    // Upload image to Google Cloud Storage
    console.log("Uploading to:", bucketName, fileName);
    await new Promise((resolve, reject) => {
      const stream = blob
        .createWriteStream({
          metadata: { contentType: imageFile.mimetype },
        })
        .on("error", reject)
        .on("finish", resolve);
      stream.end(imageFile.buffer);
    });

    // Analyze with Vision API
    console.log("Analyzing with Vision API...");
    const [visionResult] = await visionClient.labelDetection({
      image: {
        source: {
          imageUri: `gs://${bucketName}/${fileName}`,
        },
      },
    });

    const labels = visionResult.labelAnnotations || [];
    const visionResponse = {
      success: true,
      labels: labels.map((label) => ({
        description: label.description,
        score: label.score,
      })),
    };

    // Prepare prompt for Gemini AI
    const prompt = `
Analyze the following Google Vision API response and provide:

1. The HS Code for the product.
2. A detailed product description.
3. Whether the product is perishable (true/false).
4. Whether the product is hazardous (true/false).
5. A concise list of the essential documents required to export this product outside the country (only document names).
6. Additional tips and recommendations for successfully exporting this product outside the country, referencing world customs rules where applicable.

Return the result as a JSON object in this format:

{
  "HS Code": "string",
  "Product Description": "string",
  "Perishable": boolean,
  "Hazardous": boolean,
  "Required Export Document List": ["string", "string", ...],
  "Recommendations": {
    "message": "string",
    "additionalTip": "string"
  }
}

When determining the required export documents and providing recommendations, please reference world customs rules and regulations to ensure accuracy and compliance.

Vision API Response:
${JSON.stringify(visionResponse, null, 2)}
`;

    // Generate response with Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const geminiResult = await model.generateContent(prompt);
    const rawResponse = geminiResult.response.text();
    const jsonStart = rawResponse.indexOf("{");
    const jsonEnd = rawResponse.lastIndexOf("}") + 1;
    const cleanResponseText = rawResponse.slice(jsonStart, jsonEnd).trim();
    const geminiResponse = JSON.parse(cleanResponseText);

    // Construct the filtered formData response
    // const filteredFormData = {
    //   ShipmentDetails: {
    //     "HS Code": geminiResponse["HS Code"],
    //     "Product Description": geminiResponse["Product Description"],
    //   },
    // };

    // Send response to frontend
    res.json({
      data: geminiResponse,
    });
  } catch (error) {
    console.error("Error in product analysis:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze product",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});
