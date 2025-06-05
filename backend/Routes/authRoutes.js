const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("../Config/passportConfig");
const userModel = require("../Database/userSchema");
const { verifyToken } = require("../Middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "mySuperSecretKey12345!@";

const isProduction = process.env.NODE_ENV === "production";

const FRONTEND_URL = isProduction
  ? "https://www.smartlogix.page"
  : "http://localhost:5173";

// Create Account
router.post("/createAccount", async (req, res) => {
  try {
    const { firstName, lastName, emailAddress, password } = req.body;
    const userExists = await userModel.findOne({ emailAddress });
    if (userExists) {
      if (userExists.password === "GOOGLE_AUTH_PLACEHOLDER") {
        return res.status(400).send({
          message:
            "This email is already registered through Google sign-in. Please sign in with Google.",
        });
      }
      return res.status(400).send({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({
      firstName,
      lastName,
      emailAddress,
      password: hashedPassword,
    });
    // console.log(newUser);

    const token = jwt.sign(
      { id: newUser._id, email: newUser.emailAddress },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).send({
      message: "Account created successfully",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
});

// Login User
router.post("/loginUser", async (req, res) => {
  try {
    const { emailAddress, password } = req.body;
    const user = await userModel.findOne({ emailAddress });
    if (!user) {
      return res.status(401).send({ message: "User not found!" });
    }
    if (user.password === "GOOGLE_AUTH_PLACEHOLDER") {
      return res.status(401).send({
        message:
          "User registered through Google sign-in. Please sign in with Google.",
      });
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

// Google OAuth Routes
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
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

// Protected Route
router.get("/protectedRoute", verifyToken, async (req, res) => {
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
        profilePhoto: user.profilePhoto,
        phoneNumber: user.phoneNumber,
        companyName: user.companyName,
        companyAddress: user.companyAddress || {}, // Ensure companyAddress is an object, even if null
        taxId: user.taxId,
      },
    });
  } catch (error) {
    console.error("Error in protected route:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
