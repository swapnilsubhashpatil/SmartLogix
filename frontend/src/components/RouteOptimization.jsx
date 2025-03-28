import React, { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  CircularProgress,
  Chip,
  Box,
} from "@mui/material";
import { LoadScript } from "@react-google-maps/api";
import { motion } from "framer-motion";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MapIcon from "@mui/icons-material/Map";
import Co2Icon from "@mui/icons-material/Co2";
import SaveIcon from "@mui/icons-material/Save";
import RouteIcon from "@mui/icons-material/Route";
import TimerIcon from "@mui/icons-material/Timer";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useNavigate } from "react-router-dom";

const GOOGLE_MAPS_API_KEY = "AIzaSyAmyeWi4SPcXM7dkR1hduoIqL5uyMXtqUk"; // Replace with your key

const RouteOptimizer = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [weight, setWeight] = useState("");
  const [routes, setRoutes] = useState({
    popular: [],
    costEfficient: [],
    timeEfficient: [],
    allRoutes: [],
  });
  const [displayedRoutes, setDisplayedRoutes] = useState([]);
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapLoading, setMapLoading] = useState(null);
  const [carbonLoading, setCarbonLoading] = useState(null);
  const [saveLoading, setSaveLoading] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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
        "http://localhost:3003/api/route-optimization",
        { from, to, weight: parseFloat(weight) },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      setRoutes({
        popular: data.popularRoutes,
        costEfficient: data.costEfficientRoutes,
        timeEfficient: data.timeEfficientRoutes,
        allRoutes: [
          ...data.popularRoutes,
          ...data.costEfficientRoutes,
          ...data.timeEfficientRoutes,
        ],
      });
      setDisplayedRoutes(data.popularRoutes);
      setActiveFilter("popular");
      setShowResults(true);
    } catch (error) {
      console.error("Error fetching routes:", error);
      alert(
        `Failed to fetch routes: ${
          error.response?.data?.error || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    switch (filter) {
      case "popular":
        setDisplayedRoutes(routes.popular);
        break;
      case "cost":
        setDisplayedRoutes(routes.costEfficient);
        break;
      case "time":
        setDisplayedRoutes(routes.timeEfficient);
        break;
      case "carbon":
        const sortedByCarbon = [...routes.allRoutes].sort(
          (a, b) => a.totalCarbonEmission - b.totalCarbonEmission
        );
        setDisplayedRoutes(sortedByCarbon);
        break;
      default:
        break;
    }
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
        "http://localhost:3003/api/routes",
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
      const routeKey = `route_${index}_${Date.now()}`;
      sessionStorage.setItem(routeKey, JSON.stringify(routeDataObj));

      const mapUrl = `/map/${index}/${routeKey}`;
      window.open(mapUrl, "_blank");
    } catch (error) {
      console.error("Error fetching map data:", error);
      alert("Failed to fetch map data.");
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
        vehicleType: "truck",
        weight: parseFloat(weight),
      };

      const carbonKey = `carbon_${index}_${Date.now()}`;
      sessionStorage.setItem(carbonKey, JSON.stringify(carbonParams));

      const carbonUrl = `/carbon-footprint/${carbonKey}`;
      window.open(carbonUrl, "_blank");
    } catch (error) {
      console.error("Error preparing carbon data:", error);
      alert("Failed to prepare carbon footprint data.");
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

      console.log("Saving route with:");
      console.log("Token:", token);
      console.log("formData:", formData);
      console.log("routeData:", routeData);

      const response = await axios.post(
        "http://localhost:3003/api/save-route",
        { formData, routeData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Route saved:", response.data);
      alert("Route saved successfully! Check your profile for history.");
    } catch (error) {
      console.error("Error saving route:", error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        "Unknown error";
      if (error.response?.status === 401) {
        alert("Unauthorized. Please log in again.");
        navigate("/");
      } else if (error.response?.status === 400) {
        alert(`Bad request: ${errorMessage}`);
      } else if (error.response?.status === 500) {
        alert(`Server error: ${errorMessage}`);
      } else {
        alert(`Failed to save route: ${errorMessage}`);
      }
    } finally {
      setSaveLoading(null);
    }
  };

  return (
    <>
      <div className="p-6 font-sans min-h-screen flex flex-col items-center">
        <div className="relative w-full bg-gray-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center py-4 lg:py-6">
              <h1
                className="
            text-4xl 
            md:text-5xl 
            lg:text-6xl 
            font-extrabold 
            text-gray-900 
            tracking-tight 
            leading-tight
            mb-4
          "
              >
                Route Optimization
              </h1>
              <p
                className="
            max-w-3xl 
            mx-auto 
            text-xl 
            text-gray-500 
            sm:text-center 
            sm:text-2xl
          "
              >
                Intelligent routing solutions for enhanced efficiency
              </p>
            </div>
          </div>

          {/* Subtle background curve */}
          <div
            className="
        absolute 
        bottom-0 
        left-0 
        right-0 
        h-16 
        bg-white 
        rounded-t-[50px] 
        shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]
      "
          ></div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-8 justify-center items-center"
        >
          <TextField
            label="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            variant="outlined"
            sx={{ backgroundColor: "white", flex: 1, minWidth: "200px" }}
          />
          <TextField
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            variant="outlined"
            sx={{ backgroundColor: "white", flex: 1, minWidth: "200px" }}
          />
          <TextField
            label="Weight (kg)"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
            inputProps={{ min: 0, step: 0.1 }}
            variant="outlined"
            sx={{ backgroundColor: "white", flex: 1, minWidth: "200px" }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: "var(--color-primary-500)",
              "&:hover": { backgroundColor: "var(--color-primary-600)" },
              padding: "10px 24px",
              minWidth: "180px",
            }}
          >
            <span className="flex items-center gap-2">
              Optimize Routes
              {loading && (
                <CircularProgress size={20} sx={{ color: "white" }} />
              )}
            </span>
          </Button>
        </form>

        {showResults && (
          <>
            <div className="flex gap-4 mb-6 flex-wrap justify-center max-w-3xl w-full">
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
                  `}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    boxShadow:
                      activeFilter === filter.key
                        ? "0 4px 6px rgba(0,0,0,0.1)"
                        : "none",
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
                  className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg flex items-center justify-between border border-gray-200"
                >
                  <div className="flex-1">
                    <Typography
                      variant="h6"
                      className="font-semibold text-gray-800"
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
                  <div className="flex items-center gap-4">
                    <Typography className="text-gray-700">
                      {route.totalDistance} km
                    </Typography>
                    <Typography className="text-gray-700">
                      {route.totalCarbonEmission} kg
                    </Typography>
                    <Typography className="text-gray-700">
                      ${route.totalCost.toFixed(2)}
                    </Typography>
                    <Typography className="text-gray-700">
                      {route.totalTime} hrs
                    </Typography>
                    <div className="flex gap-2">
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
    </>
  );
};

export default RouteOptimizer;
