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
  DialogActions,
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
  const [chooseRouteLoading, setChooseRouteLoading] = useState(null);
  const [openCarbonWarning, setOpenCarbonWarning] = useState(false); // New state for carbon warning dialog
  const [selectedRoute, setSelectedRoute] = useState(null); // Store the selected route for confirmation
  const [carbonWarningSeverity, setCarbonWarningSeverity] = useState(""); // "yellow" or "red"
  const token = localStorage.getItem("token");
  const [toastProps, setToastProps] = useState({ type: "", message: "" });
  const [saveLoading, setSaveLoading] = useState(null);
  const [Description, setDescription] = useState(true);

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

      // console.log(
      //   "Draft API response:",
      //   JSON.stringify(response.data, null, 2)
      // );

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

      // console.log("Updated state - from:", from, "to:", to, "weight:", weight);
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
        // console.log("Fetching draft with ID:", draftId);
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
    setDescription(false);
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
    // Check carbon score before proceeding
    const carbonScore = route.totalCarbonScore || 0;
    if (carbonScore > 30) {
      // Show warning dialog
      setSelectedRoute({ route, index });
      setCarbonWarningSeverity(carbonScore > 60 ? "red" : "yellow");
      setOpenCarbonWarning(true);
      return; // Wait for user confirmation
    }

    // If carbon score is <= 30, proceed directly
    await proceedWithChooseRoute(route, index);
  };

  const proceedWithChooseRoute = async (route, index) => {
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

      // console.log(
      //   "Choose Route request body:",
      //   JSON.stringify(requestBody, null, 2)
      // );

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

      // console.log(
      //   "Choose Route response:",
      //   JSON.stringify(response.data, null, 2)
      // );
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

  const handleCarbonWarningConfirm = () => {
    // Proceed with the route selection
    setOpenCarbonWarning(false);
    if (selectedRoute) {
      proceedWithChooseRoute(selectedRoute.route, selectedRoute.index);
    }
    setSelectedRoute(null);
  };

  const handleCarbonWarningCancel = () => {
    // Cancel the route selection
    setOpenCarbonWarning(false);
    setChooseRouteLoading(null);
    setSelectedRoute(null);
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
            className="w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 sm:p-8 shadow-2xl shadow-black/10"
          >
            <div className="flex flex-col sm:flex-row gap-6 w-full justify-center items-center">
              {/* From Input */}
              <div className="relative w-full max-w-xs">
                <input
                  type="text"
                  id="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  required
                  placeholder=" "
                  className="peer w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-gray-300/40 rounded-2xl text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/60 transition-all duration-300 hover:bg-white/50 hover:scale-[1.02] hover:shadow-lg hover:border-gray-400/60 active:scale-[0.98]"
                />
                <label
                  htmlFor="from"
                  className="absolute left-4 -top-2.5 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:left-4 peer-focus:bg-white/80 peer-focus:text-blue-600"
                >
                  From
                </label>
              </div>

              {/* To Input */}
              <div className="relative w-full max-w-xs">
                <input
                  type="text"
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                  placeholder=" "
                  className="peer w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-gray-300/40 rounded-2xl text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/60 transition-all duration-300 hover:bg-white/50 hover:scale-[1.02] hover:shadow-lg hover:border-gray-400/60 active:scale-[0.98]"
                />
                <label
                  htmlFor="to"
                  className="absolute left-4 -top-2.5 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:left-4 peer-focus:bg-white/80 peer-focus:text-blue-600"
                >
                  To
                </label>
              </div>

              {/* Weight Input */}
              <div className="relative w-full max-w-xs">
                <input
                  type="number"
                  id="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                  min="0"
                  step="0.1"
                  placeholder=" "
                  className="peer w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-gray-300/40 rounded-2xl text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/60 transition-all duration-300 hover:bg-white/50 hover:scale-[1.02] hover:shadow-lg hover:border-gray-400/60 active:scale-[0.98]"
                />
                <label
                  htmlFor="weight"
                  className="absolute left-4 -top-2.5 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:left-4 peer-focus:bg-white/80 peer-focus:text-blue-600"
                >
                  Weight (kg)
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl border-2 border-blue-400/30 hover:border-blue-300/50 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-lg min-w-[200px] backdrop-blur-sm"
              >
                <span className="flex items-center justify-center gap-3">
                  Optimize Routes
                  {loading && (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
        {Description && (
          <div className="w-full max-w-4xl mt-8 mb-6 sm:mb-8">
            <div className="backdrop-blur-xl bg-gradient-to-br from-green-50/80 to-blue-50/80 border border-green-200/30 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-500">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0M15 17a2 2 0 104 0"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold ">Route Optimization Info</h3>
              </div>

              {/* Main Description */}
              <div className="mb-8">
                <p className="text-gray-700 text-lg leading-relaxed">
                  Enter{" "}
                  <span className="font-semibold text-green-700">Origin</span>,{" "}
                  <span className="font-semibold text-blue-700">
                    Destination
                  </span>
                  , and{" "}
                  <span className="font-semibold text-green-700">
                    Cargo Weight
                  </span>{" "}
                  to calculate the most efficient shipping route.
                </p>
                <p className="text-gray-600 mt-3 text-base">
                  Our system prioritizes{" "}
                  <span className="font-semibold text-green-600">
                    carbon-efficient routes
                  </span>{" "}
                  to support sustainable logistics.
                </p>
              </div>

              {/* Optimization Options */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Optimization Options:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cost-Optimized */}
                  <div className="bg-white/60 backdrop-blur-sm border border-green-200/40 rounded-2xl p-5 hover:bg-white/80 hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:border-green-300/60">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-green-600 text-xl">✅</span>
                      <h5 className="font-semibold text-green-700">
                        Cost-Optimized
                      </h5>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Lowest estimated shipping cost
                    </p>
                  </div>

                  {/* Time-Optimized */}
                  <div className="bg-white/60 backdrop-blur-sm border border-blue-200/40 rounded-2xl p-5 hover:bg-white/80 hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:border-blue-300/60">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-blue-600 text-xl">⏱️</span>
                      <h5 className="font-semibold text-blue-700">
                        Time-Optimized
                      </h5>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Fastest delivery route
                    </p>
                  </div>

                  {/* Carbon-Efficient */}
                  <div className="bg-white/60 backdrop-blur-sm border border-green-200/40 rounded-2xl p-5 hover:bg-white/80 hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:border-green-300/60">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-green-600 text-xl">🌱</span>
                      <h5 className="font-semibold text-green-700">
                        Carbon-Efficient
                      </h5>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Route with the lowest CO₂ emissions
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Features */}
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-300/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl shadow-md flex-shrink-0 mt-1">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">
                      AI-Driven Calculations
                    </h5>
                    <p className="text-gray-600 leading-relaxed">
                      Our system uses real-time data from{" "}
                      <span className="font-semibold text-blue-600">
                        Google Maps API
                      </span>
                      , transport networks, and historical trends to provide the
                      most accurate route optimization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
        open={openCarbonWarning}
        onClose={handleCarbonWarningCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor:
              carbonWarningSeverity === "red" ? "#f44336" : "#ffeb3b",
            color: carbonWarningSeverity === "red" ? "white" : "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">Carbon Footprint Warning</Typography>
          <IconButton onClick={handleCarbonWarningCancel}>
            <FaTimes
              color={carbonWarningSeverity === "red" ? "white" : "black"}
            />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            backgroundColor:
              carbonWarningSeverity === "red" ? "#ffebee" : "#fffde7",
            padding: 3,
          }}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            This route may not be the most carbon-efficient option. Consider
            exploring alternative routes to reduce environmental impact and
            support sustainable shipping practices.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Carbon Score: {selectedRoute?.route.totalCarbonScore || 0}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor:
              carbonWarningSeverity === "red" ? "#ffebee" : "#fffde7",
            padding: 2,
          }}
        >
          <Button
            onClick={handleCarbonWarningCancel}
            variant="outlined"
            color={carbonWarningSeverity === "red" ? "error" : "warning"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCarbonWarningConfirm}
            variant="contained"
            color={carbonWarningSeverity === "red" ? "error" : "warning"}
            startIcon={<CheckCircleIcon />}
          >
            Proceed Anyway
          </Button>
        </DialogActions>
      </Dialog>
      <Toast type={toastProps.type} message={toastProps.message} />
    </>
  );
};

export default RouteOptimization;
