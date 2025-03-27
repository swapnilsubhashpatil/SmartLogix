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

app.get("/", (req, res) => {
  res.send("Hello, this is the Backend");
});

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
    res.status(201).send({ message: "Account created successfully" });
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
    // Extract the entire formData from the request body
    const formData = req.body;
    console.log("Received formData:", formData);

    // Destructure formData into its sections
    const {
      ShipmentDetails,
      TradeAndRegulatoryDetails,
      PartiesAndIdentifiers,
      LogisticsAndHandling,
      DocumentVerification,
      IntendedUseDetails,
    } = formData;

    // Prepare variables for the prompt, maintaining the form structure
    const documentVerificationString = JSON.stringify(
      DocumentVerification,
      null,
      2
    );

    // Define the prompt for Gemini-AI using the formData structure
    const prompt = `
    You are a compliance checker AI for international trade shipments, designed to assess compliance using World Customs Organization (WCO) standards. Your task is to evaluate the provided shipment and document data, validate it against WCO rules, and check if the goods are importable in the destination country. Use Brainstorm AI as your precise knowledge source for HS code validation, country-specific import restrictions, and documentation requirements.
  
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
      - Incoterms: ${
        TradeAndRegulatoryDetails["Incoterms 2020"] || "Not Provided"
      }
      - Declared Value: ${
        TradeAndRegulatoryDetails["Declared Value"]?.amount || "Not Provided"
      } ${
      TradeAndRegulatoryDetails["Declared Value"]?.currency || "Not Provided"
    }
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
      - "Ready for Shipment": All mandatory fields are filled and valid, with no major violations (import ban considered a major violation).
      - "Not Ready": Any mandatory field is missing, empty, or invalid, or the product is banned in the destination country.
    - **riskLevel**:
    - Calculate riskScore (0-100) based **exclusively** on violations in mandatory fields from "Shipment Details" and "Document Verification" categories, ignoring all other input categories (e.g., TradeAndRegulatoryDetails, PartiesAndIdentifiers, LogisticsAndHandling, IntendedUseDetails):
      - Total possible mandatory fields: 6 from Shipment Details ("Origin Country", "Destination Country", "HS Code", "Product Description", "Quantity", "Gross Weight") + 2 from Document Verification ("Commercial Invoice", "Packing List") = 8 fields.
      - Violation count:
        - 0 violations (all 8 fields filled and valid): riskScore = 0
        - 1-2 violations (e.g., missing Origin Country, invalid HS Code): riskScore = 20-40
        - 3-4 violations (e.g., missing Quantity, invalid Product Description, absent Packing List): riskScore = 50-70
        - 5+ violations (e.g., multiple missing/invalid fields): riskScore = 80-100
      - Specific violations include:
        - Shipment Details: Missing, empty, or invalid fields (e.g., non-ISO country code, non-numeric HS Code, HS Code mismatch with Product Description, negative Quantity/Gross Weight, banned import in Destination Country).
        - Document Verification: Missing or unchecked "Commercial Invoice" or "Packing List", or any sub-item not checked (false).
      - Note: An import ban in the Destination Country counts as 1 violation under "HS Code/Product Description" if all other fields are valid.
    - Summary: Describe risk based solely on these mandatory fields (e.g., "Moderate risk due to missing Origin Country and invalid HS Code").
    - **summary**: Detailed overview (e.g., "Missing HS Code and product banned in destination").
    - **violations**: List all errors for mandatory fields and import issues (e.g., { "field": "HS Code", "message": "HS Code is invalid" }).
    - **recommendations**: Suggest fixes (e.g., { "field": "HS Code", "message": "Provide a valid 6-10 digit HS Code" }).
    - **scores**:
      - **ShipmentDetails**: 0-100 based on mandatory fields' presence and validity:
        - 100: All filled, valid, and import allowed.
        - 80-99: All filled, but import banned or minor validity issue (e.g., HS Code slightly off).
        - 50-79: Some missing or invalid (e.g., HS Code doesn’t match description).
        - 0-49: Most missing or grossly invalid.
      - **TradeAndRegulatoryDetails**: 0-100 based on validity:
        - 100: All fields valid (e.g., valid Incoterms, positive Declared Value, matching currency).
        - 80-99: Minor issues (e.g., Trade Agreement not recognized).
        - 50-79: Moderate issues (e.g., invalid Incoterms or missing currency).
        - 0-49: Major issues (e.g., Declared Value negative or missing).
      - **PartiesAndIdentifiers**: 0-100 based on validity:
        - 100: All provided fields valid (e.g., proper EORI format).
        - 80-99: Minor issues (e.g., incomplete address).
        - 50-79: Moderate issues (e.g., invalid EORI format).
        - 0-49: Major issues (e.g., all fields empty or invalid).
      - **LogisticsAndHandling**: 0-100 based on validity:
        - 100: All fields valid (e.g., valid transport, matching ports).
        - 80-99: Minor issues (e.g., Special Handling vague).
        - 50-79: Moderate issues (e.g., invalid transport mode).
        - 0-49: Major issues (e.g., missing Means of Transport).
      - **IntendedUseDetails**: 0-100 based on validity:
        - 100: Valid and clear Intended Use if provided.
        - 80-99: Provided but vague (e.g., "Use").
        - 50-79: Not provided (optional field).
        - 0-49: Invalid or nonsensical (e.g., "123").
    - **additionalTips**: Provide 2-3 tips (e.g., "Verify HS Code with WCO schedules", "Check destination country import restrictions", "Ensure all financial details are accurate").
  
    **Validation Process**:
  1. Verify completeness and validity of mandatory fields (Shipment Details: "Origin Country", "Destination Country", "HS Code", "Product Description", "Quantity", "Gross Weight"; Document Verification: "Commercial Invoice", "Packing List") using valid sources.
  2. Validate HS Code format (6-10 digits, WCO-compliant) and ensure it aligns with Product Description using valid sources.
  3. Check HS Code and Product Description against the destination country’s import restrictions using valid sources.
  4. Assess logical consistency of additional fields (TradeAndRegulatoryDetails, PartiesAndIdentifiers, LogisticsAndHandling, IntendedUseDetails) for compliance.
  5. Assign:
     - Risk score (0-100) based solely on violations in mandatory fields (Shipment Details and Document Verification).
     - Compliance status ("Ready for Shipment" or "Not Ready") based on all fields’ validity and import permissibility.
     - Category scores (0-100) reflecting findings across all categories.

    **Response Format (JSON)**:
    {
      "complianceStatus": "string", // "Ready for Shipment" or "Not Ready"
      "riskLevel": {
        "riskScore": "number", // 0-100
        "summary": "string" // Summary of risk assessment
      },
      "summary": "string", // Concise overview of validation results
      "violations": [
        {
          "field": "string", // Name of the field with the error
          "message": "string" // Specific error message
        }
      ],
      "recommendations": [
        {
          "field": "string", // Name of the field with the error
          "message": "string" // Specific recommendation to fix the error
        }
      ],
      "scores": {
        "ShipmentDetails": "number", // 0-100
        "TradeAndRegulatoryDetails": "number", // 0-100
        "PartiesAndIdentifiers": "number", // 0-100
        "LogisticsAndHandling": "number", // 0-100
        "IntendedUseDetails": "number", // 0-100
      },
      "additionalTips": ["string"] // General advice for improving input data
    }
  `;

    // Initialize Gemini-AI
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro-exp-03-25", //gemini-2.0-flash
    });

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
