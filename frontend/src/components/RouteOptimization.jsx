import React, { useState } from "react";
import { Button, TextField, Typography, CircularProgress } from "@mui/material";
import { LoadScript } from "@react-google-maps/api";
import { motion } from "framer-motion";
import axios from "axios";
import MapIcon from "@mui/icons-material/Map";
import Co2Icon from "@mui/icons-material/Co2";
import { useNavigate } from "react-router-dom";

const GOOGLE_MAPS_API_KEY = "AIzaSyAmyeWi4SPcXM7dkR1hduoIqL5uyMXtqUk";

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
  const [mapLoading, setMapLoading] = useState(null); // Track which route is loading map

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowResults(false);
    try {
      const response = await axios.post(
        "http://localhost:3003/api/route-optimization",
        { from, to, weight: parseFloat(weight) },
        { headers: { "Content-Type": "application/json" } }
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
      console.error(
        "Error fetching routes from /api/route-optimization:",
        error
      );
      alert(
        "Failed to fetch route optimization data. Check console for details."
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
    setMapLoading(index); // Set loading state for this route
    try {
      const routeData = route.routeDirections.map((direction) => ({
        id: direction.id,
        waypoints: direction.waypoints,
        state: direction.state,
      }));

      const response = await axios.post(
        "http://localhost:3003/api/routes",
        routeData,
        { headers: { "Content-Type": "application/json" } }
      );

      const routeDataObj = {
        originalRoute: route,
        processedRoutes: response.data,
      };

      // Store route data in sessionStorage with a unique key
      const routeKey = `route_${index}_${Date.now()}`; // Unique key to avoid conflicts
      sessionStorage.setItem(routeKey, JSON.stringify(routeDataObj));

      // Open map with just the key in the URL
      const mapUrl = `/map/${index}/${routeKey}`;
      window.open(mapUrl, "_blank");
    } catch (error) {
      console.error("Error fetching route data from /api/routes:", error);
      alert("Failed to fetch map data. Check console for details.");
    } finally {
      setMapLoading(null); // Reset loading state
    }
  };

  const handleCarbonClick = (route) => {
    alert(`Total Carbon Emission: ${route.totalCarbonEmission} kg CO2`);
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <div className="p-6 font-sans min-h-screen flex flex-col items-center">
        <Typography variant="h4" className="font-bold text-gray-800 mb-6">
          Route Optimization
        </Typography>

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
              {["popular", "cost", "time", "carbon"].map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "contained" : "outlined"}
                  onClick={() => handleFilterClick(filter)}
                  sx={{
                    backgroundColor:
                      activeFilter === filter
                        ? "var(--color-primary-500)"
                        : "white",
                    "&:hover": {
                      backgroundColor:
                        activeFilter === filter
                          ? "var(--color-primary-600)"
                          : "var(--color-primary-100)",
                    },
                    color:
                      activeFilter === filter
                        ? "white"
                        : "var(--color-primary-500)",
                  }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
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
                        onClick={() => handleCarbonClick(route)}
                        sx={{
                          minWidth: "40px",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#f1f8e9",
                          "&:hover": { backgroundColor: "#c5e1a5" },
                        }}
                      >
                        <Co2Icon sx={{ color: "#689f38" }} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </LoadScript>
  );
};

export default RouteOptimizer;
