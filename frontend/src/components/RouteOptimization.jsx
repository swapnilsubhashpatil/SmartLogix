import React, { useState, useEffect } from "react";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import MapIcon from "@mui/icons-material/Map";
import SaveIcon from "@mui/icons-material/Save";
import Co2Icon from "@mui/icons-material/Co2";
import RouteIcon from "@mui/icons-material/Route";
import TimerIcon from "@mui/icons-material/Timer";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import HomeIcon from "@mui/icons-material/Home";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // New icon for Choose Route
import { useNavigate, useLocation } from "react-router-dom";
import RouteResultsSkeleton from "./Skeleton/RouteResultsSkeleton";
import Toast from "./Toast";
import Header from "./Header";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const RouteOptimization = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [weight, setWeight] = useState("");
  const [routes, setRoutes] = useState([]);
  const [displayedRoutes, setDisplayedRoutes] = useState([]);
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapLoading, setMapLoading] = useState(null);
  const [carbonLoading, setCarbonLoading] = useState(null);
  const [chooseLoading, setChooseLoading] = useState(null);
  const [openInfoDialog, setOpenInfoDialog] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [isManualEntry, setIsManualEntry] = useState(true);
  const [carbonAnalysisResults, setCarbonAnalysisResults] = useState({});
  const [chooseRouteLoading, setChooseRouteLoading] = useState(null); // New state for Choose Route button
  const token = localStorage.getItem("token");
  const [toastProps, setToastProps] = useState({ type: "", message: "" });
  const [saveLoading, setSaveLoading] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const toHome = () => {
    navigate("/dashboard");
  };
  const fetchDraftFromServer = async (draftId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setToastProps({ type: "error", message: "Please log in." });
        navigate("/");
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/drafts/${draftId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        "Draft API response:",
        JSON.stringify(response.data, null, 2)
      );

      const draft = response.data.draft || response.data;
      if (!draft || !draft.formData?.ShipmentDetails) {
        throw new Error("Invalid draft data received");
      }

      // Update state with draft data
      setFrom(draft.formData.ShipmentDetails?.["Origin Country"] || "");
      setTo(draft.formData.ShipmentDetails?.["Destination Country"] || "");
      setWeight(draft.formData.ShipmentDetails["Gross Weight"]);

      setIsManualEntry(false);
      setSelectedDraftId(draft._id);

      console.log("Updated state - from:", from, "to:", to, "weight:", weight);
    } catch (error) {
      console.error("Error fetching draft:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch draft.";
      setToastProps({ type: "error", message: errorMessage });
      navigate("/inventory-management");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDraft = async () => {
      // Check for draftId in localStorage
      let draftId = localStorage.getItem("routeDraftId");
      if (!draftId) {
        // Check for draftId in URL query (e.g., ?draftId=...)
        const params = new URLSearchParams(location.search);
        draftId = params.get("draftId");
      }

      if (draftId) {
        console.log("Fetching draft with ID:", draftId);
        await fetchDraftFromServer(draftId);
      } else {
      }
    };

    fetchDraft();
  }, [location, navigate]);

  // [Existing getTopThreeRoutes, unchanged]
  const getTopThreeRoutes = (routes, metric) => {
    return [...routes].sort((a, b) => a[metric] - b[metric]).slice(0, 3);
  };

  // [Existing handleSubmit, unchanged]
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!token) {
      setToastProps({
        type: "error",
        message: "Please log in to optimize routes.",
      });
      navigate("/");
      return;
    }
    if (
      !from ||
      !to ||
      !weight ||
      isNaN(parseFloat(weight)) ||
      parseFloat(weight) <= 0
    ) {
      setToastProps({
        type: "error",
        message:
          "Please fill in all fields: From, To, and Weight (must be a valid positive number).",
      });
      return;
    }
    setLoading(true);
    setShowResults(false);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/route-optimization`,
        {
          from: from.trim(),
          to: to.trim(),
          weight: parseFloat(weight),
          draftId: selectedDraftId || "",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data;
      if (!Array.isArray(data) || data.length !== 9)
        throw new Error("Expected 9 routes from the backend.");
      setRoutes(data);
      const popularRoutes = data
        .filter((route) => route.tag === "popular")
        .slice(0, 3);
      setDisplayedRoutes(popularRoutes);
      setActiveFilter("popular");
      setShowResults(true);
      const carbonAnalysisEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        from: from.trim(),
        to: to.trim(),
        weight: parseFloat(weight),
        routes: data,
      };
      const carbonAnalysisHistory = JSON.parse(
        localStorage.getItem("carbonAnalysisHistory") || "[]"
      );
      carbonAnalysisHistory.push(carbonAnalysisEntry);
      localStorage.setItem(
        "carbonAnalysisHistory",
        JSON.stringify(carbonAnalysisHistory)
      );
    } catch (error) {
      console.error("Error fetching routes:", error);
      setToastProps({
        type: "error",
        message: error.response?.data?.error || "Failed to fetch routes",
      });
      setTimeout(
        () => setToastProps({ type: "info", message: "Please try again." }),
        2000
      );
    } finally {
      setLoading(false);
    }
  };

  // [Existing handleFilterClick, unchanged]
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

  // [Existing getCarbonDisplay, unchanged]
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

  // [Existing handleMapClick, unchanged]
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
        routeData, // Send array directly
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Create a temporary link to open the new tab
      const link = document.createElement("a");
      link.href = `/map/${response.data.draftId}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error fetching map data:", error);
      setToastProps({ type: "error", message: "Failed to fetch map data." });
    } finally {
      setMapLoading(null);
    }
  };

  // [Existing handleCarbonClick, unchanged]

  const handleCarbonClick = async (route, index) => {
    setCarbonLoading(index);
    try {
      const carbonParams = {
        origin: route.routeDirections[0].waypoints[0],
        destination:
          route.routeDirections[route.routeDirections.length - 1].waypoints[1],
        distance: route.totalDistance,
        weight: parseFloat(weight),
        routeDirections: route.routeDirections,
      };
      const response = await axios.post(
        `${BACKEND_URL}/api/carbon-footprint`,
        carbonParams,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCarbonAnalysisResults((prev) => ({ ...prev, [index]: response.data }));

      // Create a temporary link to open the new tab
      const link = document.createElement("a");
      link.href = `/carbon-footprint/${response.data.draftId}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer"; // Security best practice
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error fetching carbon data:", error);
      setToastProps({
        type: "error",
        message: error.response?.data?.error || "Failed to fetch carbon data.",
      });
    } finally {
      setCarbonLoading(null);
    }
  };

  // New function for Choose Route button
  const handleChooseRouteClick = async (route, index) => {
    setChooseRouteLoading(index);
    try {
      if (!from || !from.trim()) throw new Error("Origin (from) is required");
      if (!to || !to.trim()) throw new Error("Destination (to) is required");
      if (!weight || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0)
        throw new Error("Weight must be a positive number");
      if (
        !route ||
        !route.routeDirections ||
        !Array.isArray(route.routeDirections)
      )
        throw new Error("Route data is invalid");

      // Use selectedDraftId from state, fallback to URL query
      let draftId = selectedDraftId;
      if (!draftId) {
        const params = new URLSearchParams(location.search);
        draftId = params.get("draftId");
      }

      const requestBody = {
        draftId: draftId || undefined,
        routeData: {
          routeDirections: route.routeDirections,
          totalCost: route.totalCost,
          totalTime: route.totalTime,
          totalDistance: route.totalDistance,
          totalCarbonScore: route.totalCarbonScore,
          tag: route.tag,
        },
        formData:
          isManualEntry || !draftId
            ? { from: from.trim(), to: to.trim(), weight: parseFloat(weight) }
            : undefined,
      };

      console.log(
        "Choose Route request body:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await axios.post(
        `${BACKEND_URL}/api/choose-route`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Choose Route response:",
        JSON.stringify(response.data, null, 2)
      );
      setToastProps({ type: "success", message: response.data.message });
      setTimeout(() => navigate("/inventory-management"), 2000);
    } catch (error) {
      console.error("Error choosing route:", error);
      let errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to choose route.";
      if (error.response?.status === 400) {
        errorMessage =
          error.response.data.error || "Invalid draft ID or form data.";
      } else if (error.response?.status === 404) {
        errorMessage = "Draft not found or not authorized.";
      } else if (error.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        setTimeout(() => navigate("/"), 2000);
      }
      setToastProps({ type: "error", message: errorMessage });
    } finally {
      setChooseRouteLoading(null);
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

  // [Existing handleInfoClick and handleClose, unchanged]
  const handleInfoClick = () => setOpenInfoDialog(true);
  const handleClose = () => setOpenInfoDialog(false);

  return (
    <>
      <div className="min-h-screen bg-neutral-100 p-4 sm:p-6 flex flex-col items-center">
        <Header title="Route Optimization" />

        <div className="w-full max-w-4xl mt-6 flex flex-col gap-4 mb-6 sm:mb-8 items-center justify-center">
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
        </div>

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
                    "bg-gradient-to-r from-greenExtrapolate-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600",
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
                    flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2
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
                      className="font-semibold text-gray-800 text-base sm:text-lg"
                    >
                      Route {index + 1}
                    </Typography>
                    {route.routeDirections.map((direction) => (
                      <Typography
                        key={direction.id}
                        className="text-sm text-gray-600"
                      >
                        {direction.waypoints.join(" → ")} ({direction.state})
                      </Typography>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full">
                      <div className="flex flex-col items-center">
                        <Typography className="text-gray-700 text-sm sm:text-base">
                          {route.totalDistance} km
                        </Typography>
                        <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-full mt-1">
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
                        <span className="text-xs text-gray-500 flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full mt-1">
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
                        <Typography className="text-gray-700 text-sm sm:text-base">
                          ${route.totalCost.toFixed(2)}
                        </Typography>
                        <span className="text-xs text-gray-500 flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full mt-1">
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
                        <Typography className="text-gray-700 text-sm sm:text-base">
                          {route.totalTime} hrs
                        </Typography>
                        <span className="text-xs text-gray-500 flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-full mt-1">
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
                    <div className="flex gap-2 p-2 w-full sm:w-auto justify-start sm:justify-end">
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
                      <Button
                        onClick={() => handleChooseRouteClick(route, index)}
                        disabled={chooseRouteLoading === index}
                        sx={{
                          minWidth: "40px",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#e3f2f1",
                          "&:hover": { backgroundColor: "#b39ddb" },
                        }}
                      >
                        {chooseRouteLoading === index ? (
                          <CircularProgress
                            size={20}
                            sx={{ color: "#5e35b1" }}
                          />
                        ) : (
                          <CheckCircleIcon sx={{ color: "#5e35b1" }} />
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
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <Box className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 20l sounded-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13 l6-3m-6 3V7m6 10l5.447-2.724A1 1 0 0021 13.382V2.618a1 1 0 00-1.447-.894L15 4m0 13V4"
                  />
                </svg>
                <div>
                  <Typography
                    variant="h6"
                    className="text-gray-800 font-semibold"
                  >
                    Distance
                  </Typography>
                  <Typography className="text-gray-600">
                    We calculate the shortest possible path between waypoints
                    using great-circle distances, representing real-world
                    geography between your origin and destination.
                  </Typography>
                </div>
              </Box>
              <Box className="flex items-start gap-3 p-4 bg-green-50 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
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
                    routes.
                  </Typography>
                </div>
              </Box>
              <Box className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c-1.11 0-2.08.402-2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
                    mode, including transfer fees at each waypoint.
                  </Typography>
                </div>
              </Box>
              <Box className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
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
                    each waypoint.
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

export default RouteOptimization;
