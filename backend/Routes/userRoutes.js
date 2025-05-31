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
          "You are authorized by Google. Your password cannot be modified. Please contact Google.",
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
    const userId = req.user.id;
    const { phoneNumber, companyName, companyAddress, taxId } = req.body;

    const updateData = {
      phoneNumber: phoneNumber || undefined,
      companyName: companyName || undefined,
      companyAddress: {
        street: companyAddress?.street || undefined,
        city: companyAddress?.city || undefined,
        state: companyAddress?.state || undefined,
        postalCode: companyAddress?.postalCode || undefined,
        country: companyAddress?.country || undefined,
      },
      taxId: taxId || undefined,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
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
