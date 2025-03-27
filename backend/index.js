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

dotenv.config();
connectMongoDB();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());

const JWT_SECRET = process.env.JWT_SECRET || "mySuperSecretKey12345!@";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
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
            password: await bcrypt.hash(profile.id, 10), // Using Google ID as password
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await userModel.findById(id);
  done(null, user);
});

// Root Route
app.get("/", (req, res) => {
  res.send("Hello, this is the Backend");
});

// Create Account Route
app.post("/createAccount", async (req, res) => {
  try {
    const { firstName, lastName, emailAddress, password } = req.body;

    // Check if user already exists
    const userExists = await userModel.findOne({ emailAddress });
    if (userExists) {
      return res.status(400).send({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await userModel.create({
      firstName,
      lastName,
      emailAddress,
      password: hashedPassword,
    });

    console.log(newUser);
    res.status(201).send({ message: "Account created successfully" });
  } catch (error) {
    console.error("Error creating account:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
});

// Login Route with JWT Token Generation
app.post("/loginUser", async (req, res) => {
  try {
    const { emailAddress, password } = req.body;

    // Check if user exists
    const user = await userModel.findOne({ emailAddress });

    if (!user) {
      return res.status(401).send({ message: "User not found!" });
    }

    // Verify password
    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return res.status(401).send({ message: "Invalid credentials!" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, email: user.emailAddress },
      JWT_SECRET,
      {
        expiresIn: "1h", // Token validity
      }
    );

    res.status(200).send({
      message: "Logged in successfully!",
      token, // Send the token to the client
      user,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).send({ message: "An error occurred" });
  }
});

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
    res.redirect(`http://localhost:5173/dashboard`);
  }
);

// Verify JWT middleware
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

app.get("/protectedRoute", verifyToken, (req, res) => {
  res.status(200).send({
    message: "Access granted to protected route!",
    user: req.user,
  });
});

const GOOGLE_API_KEY =
  process.env.GOOGLE_API_KEY || "AIzaSyAuVwzksyAl-eATP99mxACJq1Z1MLOscZc";

app.post("/api/compliance-check", async (req, res) => {
  try {
    // Extract data from the request body
    const { complianceData, documentVerification } = req.body;
    console.log(complianceData);
    // Destructure complianceData for use in the prompt
    const {
      product: {
        hsCode,
        safetyCert,
        dualUse,
        isPerishable,
        tempControl,
        manufacturer,
        weight,
        quantity,
        value,
      },
      trade: {
        originCountry,
        destinationCountry,
        incoterms,
        tradeAgreement,
        exportLicense,
        eori,
      },
      financial: { currency },
      transportation: {
        transportMeans,
        portLoading,
        portDischarge,
        specialHandling,
        handlingDetails,
      },
    } = complianceData;

    // Convert documentVerification to a string for the prompt
    const documentVerificationString = JSON.stringify(
      documentVerification,
      null,
      2
    );

    // Define the prompt for Gemini-AI
    const prompt = `
  You are a compliance checker AI for international trade shipments. Your task is to evaluate the provided compliance data and document verification data to determine the shipment's compliance status. Check the inputs against standard international trade compliance rules (e.g., HS Code classification, safety standards, sanctions, documentation requirements, financial regulations, and transportation guidelines) using your knowledge base or standard compliance databases.

  **Inputs**:
  - Product Compliance:
    - HS Code: ${hsCode}
    - Safety Certification: ${safetyCert || "None"}
    - Dual-Use Goods: ${dualUse}
    - Perishable Goods: ${isPerishable}
    - Temperature Control: ${tempControl || "Not specified"}
    - Manufacturer: ${manufacturer}
    - Weight: ${weight} kg
    - Quantity: ${quantity}
    - Value: ${value} USD
  - Trade Compliance:
    - Origin Country: ${originCountry}
    - Destination Country: ${destinationCountry}
    - Incoterms: ${incoterms}
    - Trade Agreement: ${tradeAgreement || "None"}
    - Export License: ${exportLicense || "Not specified"}
    - EORI/Tax ID: ${eori}
  - Financial Compliance:
    - Currency: ${currency}
  - Transportation Compliance:
    - Transport Means: ${transportMeans}
    - Port of Loading: ${portLoading}
    - Port of Discharge: ${portDischarge}
    - Special Handling: ${specialHandling || "None"}
    - Handling Details: ${handlingDetails || "Not specified"}
  - Document Verification:
    ${documentVerificationString}

  **Response Format (JSON)**:
  {
    "complianceStatus": "string", // "Compliant", "Warning", "Non-Compliant"
    "riskScore": "number", // 0-100
    "complianceDetails": {
      "productCompliance": {
        "hsCode": { "status": "string", "message": "string" },
        "safetyStandards": { "status": "string", "message": "string" },
        "dualUse": { "status": "string", "message": "string" },
        "perishable": { "status": "string", "message": "string" },
        "manufacturer": { "status": "string", "message": "string" }
      },
      "tradeCompliance": {
        "countryRegulations": { "status": "string", "message": "string" },
        "declaredValue": { "status": "string", "message": "string" },
        "incoterms": { "status": "string", "message": "string" },
        "tradeAgreements": { "status": "string", "message": "string" },
        "licenses": { "status": "string", "message": "string" },
        "eori": { "status": "string", "message": "string" }
      },
      "documentCompliance": {
        "[docName]": {
          "status": "string",
          "compliancePercentage": "number",
          "details": [
            { "subItem": "string", "status": "string" }
          ]
        }
      },
      "financialCompliance": {
        "currency": { "status": "string", "message": "string" }
      },
      "transportationCompliance": {
        "transportMeans": { "status": "string", "message": "string" },
        "portRegulations": { "status": "string", "message": "string" },
        "specialHandling": { "status": "string", "message": "string" }
      }
    },
    "violations": ["string"],
    "recommendations": ["string"],
    "scores": {
      "product": "number",
      "trade": "number",
      "document": "number",
      "financial": "number",
      "transport": "number"
    }
  }

  **Output Rules**:
  - Return a strictly JSON-formatted response.
  - Do not include any additional text, comments, or markdown outside the JSON structure.
`;

    // Initialize Gemini-AI
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Send the prompt to Gemini-AI
    const result = await model.generateContent(prompt);

    // Log the raw response for debugging
    const rawResponse = result.response.text();
    console.log("Raw Response:", rawResponse);

    // Remove any non-JSON content from the response
    const jsonStart = rawResponse.indexOf("{");
    const jsonEnd = rawResponse.lastIndexOf("}") + 1;
    const cleanResponseText = rawResponse.slice(jsonStart, jsonEnd).trim();

    // Parse the cleaned response as JSON
    const response = JSON.parse(cleanResponseText);

    // Send the response back to the frontend
    res.json(response);
  } catch (error) {
    console.error("Error in compliance check endpoint:", error);
    res
      .status(500)
      .json({ error: "Failed to generate compliance check analysis" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});
