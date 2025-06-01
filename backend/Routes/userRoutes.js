const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { verifyToken } = require("../Middleware/auth");
const User = require("../Database/userSchema");
const Draft = require("../Database/draftSchema");
const SaveRoute = require("../Database/saveRouteSchema");
const ProductAnalysis = require("../Database/productAnalysisSchema");
const { storage, upload } = require("../Config/multerConfig");

// Update Username
router.put("/api/user/update-username", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName } = req.body;

    if (!firstName) {
      return res.status(400).json({ error: "First name is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Username updated successfully",
      user: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      },
    });
  } catch (error) {
    console.error("Error updating username:", error);
    res.status(500).json({ error: "Failed to update username" });
  }
});

// Update Password
router.put("/api/user/update-password", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPassword } = req.body;

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is authenticated via Google
    if (user.password === "GOOGLE_AUTH_PLACEHOLDER") {
      return res.status(403).json({
        error:
          "You are authorized by Google. Password changes are not allowed for this account",
      });
    }

    // Proceed with password update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
});

// Update Profile Information
router.put("/api/user/update-profile", verifyToken, async (req, res) => {
  try {
    // Validate user ID from token
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid or missing user ID" });
    }

    // Extract only the allowed fields from request body
    const { phoneNumber, companyName, companyAddress, taxId } = req.body;

    // Validate required fields (making phoneNumber required, similar to firstName in the reference)
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Build update data, excluding undefined values and restricting to allowed fields
    const updateData = {};
    updateData.phoneNumber = phoneNumber; // Required field, already validated
    if (companyName !== undefined) updateData.companyName = companyName;
    if (taxId !== undefined) updateData.taxId = taxId;

    // Handle nested companyAddress using dot notation
    if (companyAddress) {
      const addressFields = {
        "companyAddress.street": companyAddress.street,
        "companyAddress.city": companyAddress.city,
        "companyAddress.state": companyAddress.state,
        "companyAddress.postalCode": companyAddress.postalCode,
        "companyAddress.country": companyAddress.country,
      };

      Object.entries(addressFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          updateData[key] = value;
        }
      });
    }

    // Log the update data for debugging
    // console.log("Update data:", updateData);

    // Check if user exists by userId
    let user = await User.findById(userId);

    if (user) {
      // User exists, update their profile
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prepare response with only the updated fields
      const responseUser = {
        phoneNumber: updatedUser.phoneNumber,
        companyName: updatedUser.companyName,
        companyAddress: updatedUser.companyAddress || {},
        taxId: updatedUser.taxId,
      };

      return res.status(200).json({
        message: "Profile updated successfully",
        user: responseUser,
      });
    } else {
      // User does not exist, create a new user with only the allowed fields
      const newUserData = {
        ...updateData,
        createdAt: new Date(),
      };

      const newUser = new User(newUserData);
      const savedUser = await newUser.save();

      // Prepare response with only the created fields
      const responseUser = {
        phoneNumber: savedUser.phoneNumber,
        companyName: savedUser.companyName,
        companyAddress: savedUser.companyAddress || {},
        taxId: savedUser.taxId,
      };

      return res.status(201).json({
        message: "Profile created successfully",
        user: responseUser,
      });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Delete Account
router.delete("/api/user/delete-account", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete user and all associated data
    await User.findByIdAndDelete(userId);
    await Draft.deleteMany({ userId });
    await SaveRoute.deleteMany({ userId });
    await ProductAnalysis.deleteMany({ userId });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Upload Profile Photo
router.post(
  "/api/user/upload-photo",
  verifyToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No photo uploaded" });
      }

      const userId = req.user.id;
      const imageFile = req.file;
      const bucketName =
        process.env.GOOGLE_CLOUD_BUCKET_NAME || "your-bucket-name";

      if (!bucketName) {
        return res.status(500).json({ error: "Bucket name not configured" });
      }

      const fileName = `${userId}_${Date.now()}_${imageFile.originalname}`;
      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(`profile_photos/${fileName}`);

      // Upload image to Google Cloud Storage
      await new Promise((resolve, reject) => {
        const stream = blob
          .createWriteStream({
            metadata: { contentType: imageFile.mimetype },
          })
          .on("error", reject)
          .on("finish", resolve);
        stream.end(imageFile.buffer);
      });

      // Generate a signed URL for the image (expires in 1 year)
      const [signedUrl] = await blob.getSignedUrl({
        action: "read",
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });

      // Update user with the signed URL
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePhoto: signedUrl },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res
        .status(200)
        .json({ message: "Profile photo uploaded successfully", signedUrl });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ error: "Failed to upload profile photo" });
    }
  }
);

module.exports = router;
