const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { verifyToken } = require("../Middleware/auth");
const Draft = require("../Database/draftSchema");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Create a new draft (from "+" button)
router.post("/api/drafts", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      originCountry,
      destinationCountry,
      hsCode,
      productDescription,
      perishable,
      hazardous,
      weight,
    } = req.body;

    // Validate required fields
    if (
      !originCountry ||
      !destinationCountry ||
      !hsCode ||
      !weight ||
      !productDescription
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: originCountry, destinationCountry, hsCode, productDescription, weight",
      });
    }

    // Ensure weight is a number
    const validatedWeight = Number(weight);
    if (isNaN(validatedWeight) || validatedWeight <= 0) {
      return res
        .status(400)
        .json({ error: "Weight must be a valid positive number" });
    }

    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }
    const validatedUserId = new mongoose.Types.ObjectId(userId);

    // Create draft with form data
    const draft = await Draft.create({
      userId: validatedUserId,
      formData: {
        ShipmentDetails: {
          "Origin Country": originCountry,
          "Destination Country": destinationCountry,
          "HS Code": hsCode,
          "Product Description": productDescription,
          "Gross Weight": validatedWeight,
        },
        TradeAndRegulatoryDetails: {
          Perishable: perishable,
          "Hazardous Material": hazardous,
        },
      },
      statuses: {
        compliance: "notDone",
        routeOptimization: "notDone",
      },
      timestamp: new Date(),
    });

    res.status(201).json({
      message: "Draft created successfully",
      recordId: draft._id,
    });
  } catch (error) {
    console.error("Error creating draft:", error.stack);
    res.status(500).json({
      error: "Failed to create draft",
      details: error.message,
    });
  }
});

// Update draft (used by compliance check, route optimization, product analysis, carbon footprint)
router.put("/api/drafts/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const draftId = req.params.id;
    const updateData = req.body;

    // Validate draftId
    if (!mongoose.Types.ObjectId.isValid(draftId)) {
      return res.status(400).json({ error: "Invalid draftId format" });
    }

    // Ensure userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // Find draft and ensure it belongs to the user
    const draft = await Draft.findOne({ _id: draftId, userId });
    if (!draft) {
      return res
        .status(404)
        .json({ message: "Draft not found or not authorized" });
    }

    // Update draft with provided data
    Object.assign(draft, updateData);
    await draft.save();

    res.status(200).json({
      message: "Draft updated successfully",
      recordId: draft._id,
    });
  } catch (error) {
    console.error("Error updating draft:", error.stack);
    res.status(500).json({
      error: "Failed to update draft",
      details: error.message,
    });
  }
});

// Get drafts for inventory management page (filtered by tab)
router.get("/api/drafts", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tab = req.query.tab; // Tab filter: 'yet-to-be-checked', 'compliant', 'non-compliant', 'ready-for-shipment'

    // Ensure userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    let query = { userId };
    switch (tab) {
      case "yet-to-be-checked":
        query.$or = [
          {
            "statuses.compliance": "notDone",
            "statuses.routeOptimization": "notDone",
          },
          {
            "statuses.compliance": "notDone",
            "statuses.routeOptimization": "done",
          },
        ];
        break;
      case "compliant":
        query["statuses.compliance"] = "compliant";
        query["statuses.routeOptimization"] = "notDone";
        break;
      case "non-compliant":
        query["statuses.compliance"] = "nonCompliant";
        query["statuses.routeOptimization"] = "notDone";
        break;
      case "ready-for-shipment":
        query["statuses.compliance"] = "compliant";
        query["statuses.routeOptimization"] = "done";
        break;
      default:
        return res.status(400).json({ error: "Invalid tab parameter" });
    }

    const drafts = await Draft.find(query).sort({ timestamp: -1 }); // Newest first

    res.status(200).json({
      message: "Drafts retrieved successfully",
      drafts,
    });
  } catch (error) {
    console.error("Error fetching drafts:", error.stack);
    res.status(500).json({
      error: "Failed to fetch drafts",
      details: error.message,
    });
  }
});

// Get single draft for draft selector component
router.get("/api/drafts/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const draftId = req.params.id;

    // Validate draftId
    if (!mongoose.Types.ObjectId.isValid(draftId)) {
      return res.status(400).json({ error: "Invalid draftId format" });
    }

    // Ensure userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const draft = await Draft.findOne({ _id: draftId, userId });
    if (!draft) {
      return res
        .status(404)
        .json({ message: "Draft not found or not authorized" });
    }

    res.status(200).json({
      message: "Draft retrieved successfully",
      draft,
    });
  } catch (error) {
    console.error("Error fetching draft:", error.stack);
    res.status(500).json({
      error: "Failed to fetch draft",
      details: error.message,
    });
  }
});

// Delete draft
router.delete("/api/drafts/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const draftId = req.params.id;

    // Validate draftId
    if (!mongoose.Types.ObjectId.isValid(draftId)) {
      return res.status(400).json({ error: "Invalid draftId format" });
    }

    // Ensure userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const deletedDraft = await Draft.findOneAndDelete({ _id: draftId, userId });
    if (!deletedDraft) {
      return res
        .status(404)
        .json({ message: "Draft not found or not authorized" });
    }

    res.status(200).json({ message: "Draft deleted successfully" });
  } catch (error) {
    console.error("Error deleting draft:", error.stack);
    res.status(500).json({
      error: "Failed to delete draft",
      details: error.message,
    });
  }
});

// GET draft by ID (ensure this is also present)
router.get("/api/drafts/:id", async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }
    res.json(draft);
  } catch (error) {
    console.error("Error fetching draft:", error);
    res.status(500).json({ error: "Failed to fetch draft" });
  }
});

module.exports = router;
