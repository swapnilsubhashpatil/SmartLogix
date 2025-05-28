import React, { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { FaTimes } from "react-icons/fa";
import { LoadScript } from "@react-google-maps/api";
import { motion } from "framer-motion";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import MapIcon from "@mui/icons-material/Map";
import Co2Icon from "@mui/icons-material/Co2";
import SaveIcon from "@mui/icons-material/Save";
import RouteIcon from "@mui/icons-material/Route";
import TimerIcon from "@mui/icons-material/Timer";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import HomeIcon from "@mui/icons-material/Home";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import InfoIcon from "@mui/icons-material/Info";
import { useNavigate } from "react-router-dom";
import RouteResultsSkeleton from "./Skeleton/RouteResultsSkeleton";
import Toast from "./Toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const RouteOptimizer = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [weight, setWeight] = useState("");
  const [routes, setRoutes] = useState([]); // Single array of 9 unique routes
  const [displayedRoutes, setDisplayedRoutes] = useState([]);
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapLoading, setMapLoading] = useState(null);
  const [carbonLoading, setCarbonLoading] = useState(null);
  const [saveLoading, setSaveLoading] = useState(null);
  const [openInfoDialog, setOpenInfoDialog] = useState(false);
  const token = localStorage.getItem("token");
  const [toastProps, setToastProps] = useState({ type: "", message: "" });
  const navigate = useNavigate();

  const toHome = () => {
    navigate("/dashboard");
  };

  // Function to sort and extract top 3 routes for a given metric
  const getTopThreeRoutes = (routes, metric) => {
    return [...routes].sort((a, b) => a[metric] - b[metric]).slice(0, 3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please log in to optimize routes.");
      navigate("/");
      return;
    }
    setLoading(true);
    setShowResults(false);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/route-optimization`,
        { from, to, weight: parseFloat(weight) },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data; // Expecting an array of 9 unique routes
      // console.log(data);
      if (!Array.isArray(data) || data.length !== 9) {
        throw new Error("Expected 9 unique routes from the backend.");
      }

      // Store all 9 routes
      setRoutes(data);

      // Initially display popular routes (those tagged as "popular")
      const popularRoutes = data.filter((route) => route.tag === "popular");
      if (popularRoutes.length !== 3) {
        console.warn("Expected exactly 3 popular routes; adjusting...");
      }
      setDisplayedRoutes(popularRoutes.slice(0, 3)); // Ensure only 3 popular routes
      setActiveFilter("popular");
      setShowResults(true);
    } catch (error) {
      console.error("Error fetching routes:", error);
      setToastProps({
        type: "error",
        message: `Failed to fetch routes`,
      });

      setTimeout(() => {
        setToastProps({
          type: "info",
          message: "Please try again.",
        });
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    switch (filter) {
      case "popular":
        setDisplayedRoutes(
          routes.filter((route) => route.tag === "popular").slice(0, 3)
        );
        break;
      case "cost":
        setDisplayedRoutes(getTopThreeRoutes(routes, "totalCost"));
        break;
      case "time":
        setDisplayedRoutes(getTopThreeRoutes(routes, "totalTime"));
        break;
      case "carbon":
        setDisplayedRoutes(getTopThreeRoutes(routes, "totalCarbonScore"));
        break;
      default:
        setDisplayedRoutes(
          routes.filter((route) => route.tag === "popular").slice(0, 3)
        );
        break;
    }
  };

  const getCarbonDisplay = (score) => {
    const color =
      score < 33
        ? "text-green-600"
        : score < 66
        ? "text-yellow-600"
        : "text-red-600";
    const arrow =
      score < 50 ? (
        <ArrowDownwardIcon fontSize="small" />
      ) : (
        <ArrowUpwardIcon fontSize="small" />
      );
    return (
      <span className={`flex items-center ${color}`}>
        {arrow}
        {score.toFixed(2)}
      </span>
    );
  };

  const handleMapClick = async (route, index) => {
    setMapLoading(index);
    try {
      const routeData = route.routeDirections.map((direction) => ({
        id: direction.id,
        waypoints: direction.waypoints,
        state: direction.state,
      }));

      const response = await axios.post(
        `${BACKEND_URL}/api/routes`,
        routeData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const routeDataObj = {
        originalRoute: route,
        processedRoutes: response.data,
      };
      const routeKey = `route_data_${index}`;
      localStorage.setItem(routeKey, JSON.stringify(routeDataObj));
      window.open("/map", "_blank");
    } catch (error) {
      console.error("Error fetching map data:", error);
      setToastProps({
        type: "error",
        message: "Failed to fetch map data.",
      });
    } finally {
      setMapLoading(null);
    }
  };

  const handleCarbonClick = async (route, index) => {
    setCarbonLoading(index);
    try {
      const carbonParams = {
        origin: route.routeDirections[0].waypoints[0],
        destination:
          route.routeDirections[route.routeDirections.length - 1].waypoints[1],
        distance: route.totalDistance,
        weight: parseFloat(weight),
        routeDirections: route.routeDirections, // Pass full route details
      };

      const carbonKey = `carbon_data_${Date.now()}`;
      localStorage.setItem(carbonKey, JSON.stringify(carbonParams));
      window.open(`/carbon-footprint`, "_blank");
    } catch (error) {
      console.error("Error preparing carbon data:", error);
    } finally {
      setCarbonLoading(null);
    }
  };

  const handleSaveClick = async (route, index) => {
    if (!token) {
      alert("Please log in to save routes.");
      navigate("/");
      return;
    }
    if (!from || !to || !weight) {
      alert("Please fill all fields (From, To, Weight) before saving a route.");
      return;
    }

    setSaveLoading(index);
    try {
      const formData = { from, to, weight: parseFloat(weight) };
      const routeData = route;

      const response = await axios.post(
        `${BACKEND_URL}/api/save-route`,
        { formData, routeData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setToastProps({
        type: "sucess",
        message: "Route saved successfully! Check your profile for history.",
      });
    } catch (error) {
      console.error("Error saving route:", error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        "Unknown error";
      if (error.response?.status === 401) {
        setToastProps({
          type: "error",
          message: "Unauthorized. Please log in again.",
        });
        navigate("/");
      } else {
        setToastProps({
          type: "error",
          message: `Failed to save route: ${errorMessage}`,
        });
      }
    } finally {
      setSaveLoading(null);
    }
  };

  const handleInfoClick = () => {
    setOpenInfoDialog(true);
  };

  const handleClose = () => {
    setOpenInfoDialog(false);
  };

  return (
    <>
      <div className="p-4 sm:p-6 font-sans min-h-screen flex flex-col items-center">
        <header className="relative bg-gradient-to-r from-teal-200 to-blue-400 text-white py-6 sm:py-8 rounded-b-3xl overflow-hidden w-full">
          <div className="absolute inset-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 1440 200"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 100C240 30 480 170 720 100C960 30 1200 170 1440 100V200H0V100Z"
                fill="white"
                fillOpacity="0.1"
              />
              <path
                d="M0 150C240 80 480 220 720 150C960 80 1200 220 1440 150V200H0V150Z"
                fill="white"
                fillOpacity="0.2"
              />
            </svg>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#f4ce14] rounded-full flex items-center justify-center">
                <HomeIcon
                  onClick={toHome}
                  sx={{ color: "#000", cursor: "pointer" }}
                />
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold text-white"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Route Optimization
              </h1>
            </div>
            <div>
              {showResults && (
                <IconButton onClick={handleInfoClick} sx={{ color: "white" }}>
                  <Button
                    onClick={handleInfoClick}
                    sx={{
                      color: "white",
                      borderColor: "white",
                      "&:hover": {
                        borderColor: "#e0e0e0",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                    variant="outlined"
                  >
                    <InfoIcon className="mx-2" />
                    How It Works
                  </Button>
                </IconButton>
              )}
            </div>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-4xl mt-6 flex flex-col gap-4 mb-6 sm:mb-8 items-center justify-center"
        >
          <div className="flex flex-row gap-4 w-full justify-center">
            <TextField
              label="From"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
              variant="outlined"
              sx={{
                backgroundColor: "white",
                width: "100%",
                maxWidth: "300px",
              }}
            />
            <TextField
              label="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              variant="outlined"
              sx={{
                backgroundColor: "white",
                width: "100%",
                maxWidth: "300px",
              }}
            />
            <TextField
              label="Weight (kg)"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              inputProps={{ min: 0, step: 0.1 }}
              variant="outlined"
              sx={{
                backgroundColor: "white",
                width: "100%",
                maxWidth: "300px",
              }}
            />
          </div>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: "var(--color-primary-500)",
              "&:hover": { backgroundColor: "var(--color-primary-600)" },
              padding: "10px 24px",
              width: "100%",
              maxWidth: "200px",
              margin: "0 auto",
            }}
          >
            <span className="flex items-center justify-center gap-2">
              Optimize Routes
              {loading && (
                <CircularProgress size={20} sx={{ color: "white" }} />
              )}
            </span>
          </Button>
        </form>

        {loading && <RouteResultsSkeleton />}
        {showResults && (
          <>
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 justify-center max-w-3xl w-full">
              {[
                {
                  key: "popular",
                  label: "Popular Routes",
                  icon: <RouteIcon />,
                },
                {
                  key: "cost",
                  label: "Cost Optimized",
                  icon: <AttachMoneyIcon />,
                },
                { key: "time", label: "Time Optimized", icon: <TimerIcon /> },
                {
                  key: "carbon",
                  label: "Carbon Efficient",
                  icon: <Co2Icon />,
                  className:
                    "bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600",
                },
              ].map((filter) => (
                <Button
                  key={filter.key}
                  variant={
                    activeFilter === filter.key ? "contained" : "outlined"
                  }
                  onClick={() => handleFilterClick(filter.key)}
                  className={`
                    ${
                      activeFilter === filter.key
                        ? filter.className ||
                          "bg-gradient-to-r from-blue-500 to-teal-400"
                        : "bg-white text-blue-500 border-blue-500 hover:bg-blue-50"
                    }
                    flex items-center gap-2
                    px-3 py-2 sm:px-4 sm:py-2
                  `}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    boxShadow:
                      activeFilter === filter.key
                        ? "0 4px 6px rgba(0,0,0,0.1)"
                        : "none",
                    minWidth: "120px",
                  }}
                >
                  {filter.icon}
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="space-y-4 w-full max-w-4xl">
              {displayedRoutes.map((route, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <Typography
                      variant="h6"
                      className="font-semibold text-Gray-800 text-base sm:text-lg"
                    >
                      Route {index + 1}
                    </Typography>
                    {route.routeDirections.map((direction) => (
                      <Typography
                        key={direction.id}
                        className="text-sm text-Gray-600"
                      >
                        {direction.waypoints.join(" → ")} ({direction.state})
                      </Typography>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full">
                      <div className="flex flex-col items-center">
                        <Typography className="text-Gray-700 text-sm sm:text-base">
                          {route.totalDistance} km
                        </Typography>
                        <span className="text-xs text-Gray-500 flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-full mt-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447-2.724A1 1 0 0021 13.382V2.618a1 1 0 00-1.447-.894L15 4m0 13V4"
                            />
                          </svg>
                          Distance
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Typography className="text-sm sm:text-base">
                          {getCarbonDisplay(route.totalCarbonScore)}
                        </Typography>
                        <span className="text-xs text-Gray-500 flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full mt-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Carbon Score
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Typography className="text-Gray-700 text-sm sm:text-base">
                          ${route.totalCost.toFixed(2)}
                        </Typography>
                        <span className="text-xs text-Gray-500 flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full mt-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Cost
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Typography className="text-Gray-700 text-sm sm:text-base">
                          {route.totalTime} hrs
                        </Typography>
                        <span className="text-xs text-Gray-500 flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-full mt-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Time
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 p-2 w-full sm:w-auto justify-start sm:justify-end">
                      <Button
                        onClick={() => handleMapClick(route, index)}
                        disabled={mapLoading === index}
                        sx={{
                          minWidth: "40px",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#e0f7fa",
                          "&:hover": { backgroundColor: "#b2ebf2" },
                        }}
                      >
                        {mapLoading === index ? (
                          <CircularProgress
                            size={20}
                            sx={{ color: "#00acc1" }}
                          />
                        ) : (
                          <MapIcon sx={{ color: "#00acc1" }} />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleCarbonClick(route, index)}
                        disabled={carbonLoading === index}
                        sx={{
                          minWidth: "40px",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#f1f8e9",
                          "&:hover": { backgroundColor: "#c5e1a5" },
                        }}
                      >
                        {carbonLoading === index ? (
                          <CircularProgress
                            size={20}
                            sx={{ color: "#689f38" }}
                          />
                        ) : (
                          <Co2Icon sx={{ color: "#689f38" }} />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleSaveClick(route, index)}
                        disabled={saveLoading === index}
                        sx={{
                          minWidth: "40px",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#e8f5e9",
                          "&:hover": { backgroundColor: "#c8e6c9" },
                        }}
                      >
                        {saveLoading === index ? (
                          <CircularProgress
                            size={20}
                            sx={{ color: "#388e3c" }}
                          />
                        ) : (
                          <SaveIcon sx={{ color: "#388e3c" }} />
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info Dialog */}
      <Dialog
        open={openInfoDialog}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: "16px", padding: "16px" } }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            fontSize: "1.5rem",
            color: "#00695c",
            textAlign: "center",
          }}
        >
          {showResults && "HOW IT WORKS"}
        </DialogTitle>
        <DialogContent>
          {showResults && (
            <div className="space-y-6">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={handleClose}
                  className="bg-Gray-700 hover:bg-Gray-600 text-white p-2 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <FaTimes className="w-2 h-2 sm:h-2 w-2" />
                </button>
              </div>

              {/* Distance */}
              <Box className="flex items-start gap-3 p-4 bg-Gray-50 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-Gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447-2.724A1 1 0 0021 13.382V2.618a1 1 0 00-1.447-.894L15 4m0 13V4"
                  />
                </svg>
                <div>
                  <Typography
                    variant="h6"
                    className="text-Gray-800 font-semibold"
                  >
                    Distance
                  </Typography>
                  <Typography className="text-Gray-600">
                    We calculate the shortest possible path between waypoints
                    using great-circle distances, representing real-world
                    geography between your origin and destination.
                  </Typography>
                </div>
              </Box>

              {/* Carbon Score */}
              <Box className="flex items-start gap-3 p-4 bg-green-50 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <div>
                  <Typography
                    variant="h6"
                    className="text-green-800 font-semibold"
                  >
                    Carbon Score
                  </Typography>
                  <Typography className="text-green-600">
                    Our 0-100 score shows your route's environmental impact.
                    Lower scores are greener! We compare your route's emissions
                    to the most carbon-intensive option across all possible
                    routes, with sea transport being most efficient and air
                    transport having the highest impact.
                  </Typography>
                </div>
              </Box>

              {/* Cost */}
              <Box className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <Typography
                    variant="h6"
                    className="text-yellow-800 font-semibold"
                  >
                    Cost
                  </Typography>
                  <Typography className="text-yellow-600">
                    We calculate costs based on distance, weight, and transport
                    mode, including transfer fees at each waypoint. Air
                    transport commands premium rates while sea shipping offers
                    the most economical option for heavy cargo over long
                    distances.
                  </Typography>
                </div>
              </Box>

              {/* Time */}
              <Box className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <Typography
                    variant="h6"
                    className="text-blue-800 font-semibold"
                  >
                    Time
                  </Typography>
                  <Typography className="text-blue-600">
                    Delivery time combines transit speed and handling time at
                    each waypoint. Air routes offer dramatic speed advantages
                    but require airport processing, while sea routes include
                    longer port handling times reflecting real-world logistics
                    operations.
                  </Typography>
                </div>
              </Box>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Toast type={toastProps.type} message={toastProps.message} />
    </>
  );
};

export default RouteOptimizer;
