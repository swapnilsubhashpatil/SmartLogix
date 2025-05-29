const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Draft = require("../Database/draftSchema");
const { verifyToken } = require("../Middleware/auth");

router.post("/csv", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { formData } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }
    if (!formData) {
      return res.status(400).json({ error: "formData is required" });
    }

    const draft = await Draft.create({
      userId: new mongoose.Types.ObjectId(userId),
      formData,
      routeData: {},
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

module.exports = router;
