const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("./Config/passportConfig");
const connectMongoDB = require("./Database/connectDB");
const authRoutes = require("./Routes/authRoutes");
const complianceRoutes = require("./Routes/complianceRoutes");
const routeOptimizationRoutes = require("./Routes/routeOptimizationRoutes");
const carbonFootprintRoutes = require("./Routes/carbonFootprintRoutes");
const productAnalysisRoutes = require("./Routes/productAnalysisRoutes");
const draftRoutes = require("./Routes/draftRoutes");
const chooseRoute = require("./Routes/chooseRoute");
const draftsRouter = require("./Routes/csv"); // Adjust path to drafts.js
const userRoutes = require("./Routes/userRoutes");
const newsRoutes = require("./Routes/news");

// Load environment variables
dotenv.config();
connectMongoDB();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

const isProduction = process.env.NODE_ENV === "production";

const FRONTEND_URL = isProduction
  ? "https://www.smartlogix.page"
  : "http://localhost:5173";

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

// Basic Route
app.get("/", (req, res) => {
  res.send("Hello, this is the Backend Server");
});

// Mount Routes
app.use(authRoutes);
app.use(complianceRoutes);
app.use(routeOptimizationRoutes);
app.use(carbonFootprintRoutes);
app.use(productAnalysisRoutes);
app.use(draftRoutes);
app.use(chooseRoute);
app.use(draftsRouter);
app.use(userRoutes);
app.use("/api", newsRoutes);
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});
