const express = require("express");
const router = express.Router();
const ComplianceRecord = require("../Database/complianceRecordSchema");
const Draft = require("../Database/draftSchema"); // Import Draft schema
const { verifyToken } = require("../Middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Compliance Check
router.post("/api/compliance-check", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { draftId, ...formData } = req.body; // Extract draftId and formData

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

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

    // Compliance check prompt (unchanged)
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

**Validation Rules**:
- **Mandatory Fields** (Used for Compliance and Risk Score):
  - Shipment Details: "Origin Country", "Destination Country", "HS Code", "Product Description", "Quantity", "Gross Weight" must not be "Not Provided" or empty
  - Document Verification: "Commercial Invoice" and "Packing List" must be present and checked (true), with all sub-items checked (true).
- **Logical Consistency** (Used for Scores):
  - **Shipment Details**:
    - Origin and Destination Countries: Must be valid ISO 3166-1 alpha-2 codes (e.g., CA, US).
    - HS Code: Must be a valid 6-10 digit numeric code per WCO HS nomenclature.
    - Product Description: Must align with HS Code (e.g., HS 9404.29.00 matches "mattresses").
    - Import Check: Verify if HS Code and Product Description are allowed for import in Destination Country using Brainstorm AI data (e.g., banned items like HS 9401.80.90 "baby walkers" in Canada).
    - Quantity and Gross Weight: Must be positive numbers.
  - **Trade And Regulatory Details**:
    - Incoterms: Must be a valid Incoterms 2020 value (e.g., EXW, FOB, CIF, DAP).
    - Declared Value: Amount must be a positive number; currency must be a valid ISO 4217 code (e.g., USD, EUR, CAD).
    - Currency: Must match Declared Value currency and be a valid ISO 4217 code.
    - Trade Agreement: If provided, must be a recognized agreement (e.g., USMCA, NAFTA, EU-UK TCA).
    - Dual-Use Goods: Must be "Yes" or or "No"; if "Yes", use HS Code must align with dual-use categories.
    - Hazardous Material: Must be "Yes" or or "No".
    - Perishable: Must be "Yes" or "No"; if "Yes", use Temperature Requirements in LogisticsAndHandling must be specified.
  - **Parties And Identifiers**:
    - Shipper/Exporter, ConsigneeAndImporter, Manufacturer: Must not be empty if provided; should include fields.
    - EORI/Tax ID: If provided, must follow standard formats (e.g., EU1234567 for EU, 12-3456789 for US EIN).
  - **Logistics And Handling**:
    - Means of Transport: Must be one of "Sea", "Air", "Road", or "Rail".
    - Port of Loading/OfDischarge: If provided, Must be valid ports.
    - Special Handling: If provided, must be Reasonable.
    - Temperature Requirements: Must be specified if Perishable is "Yes".
  - **Intended Use Details**:
    - Intended Use: If provided, must be a clear description.

**Output Rules**:
- Return a strictly JSON-formatted JSON response with no extra text outside the JSON object.
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Generate compliance response
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();

    // Log the raw response for debugging purposes
    // console.log("Raw AI response:", rawResponse);

    // Regular expression to find a JSON object.
    const jsonRegex = /\{[\s\S]*\}/;
    const match = rawResponse.match(jsonRegex);

    let complianceResponse;
    if (!match) {
      console.error("No JSON object found in the raw AI response.");
      return res
        .status(500)
        .json({ error: "Invalid AI response format: No JSON object found." });
    }

    const cleanResponseText = match[0];

    try {
      complianceResponse = JSON.parse(cleanResponseText);
      // console.log(
      //   "Successfully parsed compliance response:",
      //   complianceResponse
      // );
    } catch (parseError) {
      console.error(
        "Error parsing extracted JSON from AI response:",
        parseError
      );
      // console.log("Attempted to parse:", cleanResponseText);
      return res
        .status(500)
        .json({ error: "Invalid AI response format: Malformed JSON." });
    }

    // Capture the original AI status before standardization
    const originalAIComplianceStatus = complianceResponse.complianceStatus;

    // Standardize compliance status for internal database use (draft, compliance record)
    let standardizedStatus;
    if (originalAIComplianceStatus === "Ready for Shipment") {
      standardizedStatus = "compliant";
    } else if (originalAIComplianceStatus === "Not Ready") {
      standardizedStatus = "nonCompliant";
    } else {
      standardizedStatus = "nonCompliant"; // Default for unexpected statuses
    }

    // Save compliance record
    // The complianceResponse sent to the record will retain the original AI status
    const complianceRecord = await ComplianceRecord.create({
      userId,
      formData,
      complianceResponse, // This now contains the full AI response with original status
      timestamp: new Date(),
      type: "complianceCheck",
    });

    // Handle draft: update if draftId exists, otherwise create new
    let draft;
    if (draftId && mongoose.Types.ObjectId.isValid(draftId)) {
      // Update existing draft
      draft = await Draft.findOne({ _id: draftId, userId });
      if (!draft) {
        return res
          .status(404)
          .json({ error: "Draft not found or not authorized" });
      }
      draft.formData = formData;
      // When saving to draft, ensure complianceResponse is a distinct object to prevent mutation issues
      // and retain the original AI status for the `complianceResponse` field
      draft.complianceData = { ...complianceResponse };
      draft.statuses.compliance = standardizedStatus; // Use standardized status for draft status
      draft.timestamp = new Date();
      draft.markModified("statuses");
      draft.markModified("complianceData");
      await draft.save();
    } else {
      // Create new draft
      draft = await Draft.create({
        userId,
        formData,
        // When saving to draft, ensure complianceResponse is a distinct object
        // and retain the original AI status for the `complianceResponse` field
        complianceData: { ...complianceResponse },
        statuses: {
          compliance: standardizedStatus, // Use standardized status for draft status
          routeOptimization: "notDone",
        },
        timestamp: new Date(),
      });
    }

    // Send final response to frontend
    // The complianceResponse sent to the frontend will also retain the original AI status
    res.json({
      complianceResponse, // Send the fully processed compliance response with original status
      recordId: draft._id,
    });
  } catch (error) {
    console.error("Error in compliance check endpoint:", error);
    res
      .status(500)
      .json({ error: "Failed to generate compliance check analysis" });
  }
});

// Get Compliance History
router.get("/api/compliance-history", verifyToken, async (req, res) => {
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
    console.error("Error retrieving compliance history:", error);
    res.status(500).json({ error: "Failed to retrieve compliance history" });
  }
});

router.delete(
  "/api/compliance-history/:recordId",
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { recordId } = req.params;

      const record = await ComplianceRecord.findOneAndDelete({
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
  }
);

module.exports = router;
