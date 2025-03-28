import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaLeaf, FaRoute, FaLightbulb, FaChartLine } from "react-icons/fa";
import { useParams } from "react-router-dom";

function CarbonFootprint() {
  const { carbonKey } = useParams();
  const [carbonData, setCarbonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCarbonFootprint();
  }, [carbonKey]);

  const fetchCarbonFootprint = async () => {
    setLoading(true);
    setCarbonData(null);
    setError(null);

    try {
      // Retrieve parameters from sessionStorage
      const params = JSON.parse(sessionStorage.getItem(carbonKey));
      console.log("Retrieved params from sessionStorage:", params);

      if (!params) {
        throw new Error(
          "No carbon footprint parameters found in sessionStorage"
        );
      }

      // Validate required fields
      const { origin, destination, distance, vehicleType, weight } = params;
      if (!origin || !destination || !distance || !vehicleType || !weight) {
        throw new Error("Missing required parameters in sessionStorage data");
      }

      const response = await fetch(
        "http://localhost:3003/api/carbon-footprint",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch response error:", response.status, errorText);
        throw new Error(
          `Server responded with ${response.status}: ${errorText}`
        );
      }

      const jsonData = await response.json();
      console.log("Received carbon data:", jsonData);
      setCarbonData(jsonData);

      // Clean up sessionStorage after use
      sessionStorage.removeItem(carbonKey);
    } catch (err) {
      console.error("Error fetching carbon footprint:", err);
      setError(err.message || "Failed to fetch carbon footprint data.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4 font-inter"
          >
            Movex Carbon{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Footprint Analysis
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto font-light"
          >
            Discover your carbon footprint and detailed emission analysis with
            Movex.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-gray-800 backdrop-blur-lg bg-opacity-50 rounded-3xl overflow-hidden border border-gray-700 shadow-2xl"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-20 h-20 mb-6"
              >
                <FaLeaf className="w-full h-full text-green-400" />
              </motion.div>
              <p className="text-blue-300 text-lg font-medium">
                Loading your carbon analysis...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
                className="bg-gray-700 bg-opacity-30 p-8 rounded-3xl border border-gray-600 mb-6 w-16 h-16 flex items-center justify-center"
              >
                <FaLeaf className="text-3xl text-green-400 opacity-70" />
              </motion.div>
              <h3 className="text-xl font-medium text-gray-300 mb-3">
                {error}
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchCarbonFootprint}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Retry
              </motion.button>
            </div>
          ) : carbonData ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="p-6 md:p-10"
            >
              <motion.div
                variants={itemVariants}
                className="flex items-center mb-8"
              >
                <div className="bg-green-500 bg-opacity-20 p-4 rounded-2xl mr-4">
                  <FaLeaf className="text-3xl text-green-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    Carbon Footprint Summary
                  </h2>
                  <div className="flex space-x-6 mt-4">
                    <div className="bg-gray-700 bg-opacity-50 rounded-xl p-4 flex-1">
                      <p className="text-gray-400 text-sm">Total Distance</p>
                      <p className="text-2xl font-bold">
                        {carbonData.totalDistance}
                      </p>
                    </div>
                    <div className="bg-gray-700 bg-opacity-50 rounded-xl p-4 flex-1">
                      <p className="text-gray-400 text-sm">Total Emissions</p>
                      <p className="text-2xl font-bold text-red-400">
                        {carbonData.totalEmissions}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-500 bg-opacity-20 p-4 rounded-2xl mr-4">
                    <FaRoute className="text-3xl text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Route Analysis</h3>
                </div>
                <div className="space-y-6">
                  {carbonData.routeAnalysis &&
                  carbonData.routeAnalysis.length > 0 ? (
                    carbonData.routeAnalysis.map((leg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.5 }}
                        className="bg-gray-700 bg-opacity-30 rounded-xl p-6 border border-gray-600"
                      >
                        <h4 className="text-xl font-bold mb-3 text-blue-300">
                          {leg.origin} to {leg.destination}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                            <p className="text-gray-400 text-sm">Distance</p>
                            <p className="text-xl font-semibold">
                              {leg.distance}
                            </p>
                          </div>
                          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                            <p className="text-gray-400 text-sm">
                              Fuel Consumption
                            </p>
                            <p className="text-xl font-semibold">
                              {leg.fuelConsumption}
                            </p>
                          </div>
                          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                            <p className="text-gray-400 text-sm">Fuel Type</p>
                            <p className="text-xl font-semibold">
                              {leg.fuelType}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg mb-4">
                          <p className="text-gray-400 text-sm mb-2">
                            Emissions
                          </p>
                          <p className="text-xl font-semibold text-red-400 mb-1">
                            {leg.emissions.total}
                          </p>
                          <p className="text-sm text-gray-400">
                            Intensity: {leg.emissions.intensity}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
                              <p className="text-gray-400 text-xs">
                                Tank to Wheel
                              </p>
                              <p className="text-md font-medium">
                                {leg.emissions.breakdown.tankToWheel}
                              </p>
                            </div>
                            <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
                              <p className="text-gray-400 text-xs">
                                Well to Tank
                              </p>
                              <p className="text-md font-medium">
                                {leg.emissions.breakdown.wellToTank}
                              </p>
                            </div>
                          </div>
                        </div>

                        {leg.cost && (
                          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                            <p className="text-gray-400 text-sm">
                              Estimated Cost
                            </p>
                            <p className="text-xl font-semibold">{leg.cost}</p>
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-gray-400">
                      No route analysis available.
                    </p>
                  )}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-6">
                  <div className="bg-yellow-500 bg-opacity-20 p-4 rounded-2xl mr-4">
                    <FaLightbulb className="text-3xl text-yellow-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Suggestions</h3>
                </div>
                <div className="bg-gradient-to-r from-green-900/30 to-green-700/20 rounded-xl p-6 border border-green-800/40">
                  <ul className="space-y-3">
                    {carbonData.suggestions &&
                    carbonData.suggestions.length > 0 ? (
                      carbonData.suggestions.map((suggestion, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.5 }}
                          className="flex items-start"
                        >
                          <span className="inline-block w-6 h-6 bg-green-500 bg-opacity-20 rounded-full text-green-400 flex items-center justify-center mr-3 mt-1 text-sm">
                            {index + 1}
                          </span>
                          <span className="text-gray-200">{suggestion}</span>
                        </motion.li>
                      ))
                    ) : (
                      <p className="text-gray-400">No suggestions available.</p>
                    )}
                  </ul>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex items-center mb-6">
                  <div className="bg-purple-500 bg-opacity-20 p-4 rounded-2xl mr-4">
                    <FaChartLine className="text-3xl text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Additional Insights</h3>
                </div>
                <div className="bg-gray-700 bg-opacity-30 rounded-xl p-6 border border-gray-600">
                  <ul className="space-y-3">
                    {carbonData.additionalInsights &&
                    carbonData.additionalInsights.length > 0 ? (
                      carbonData.additionalInsights.map((insight, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.5 }}
                          className="flex items-start"
                        >
                          <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-3 mt-2"></span>
                          <span className="text-gray-200">{insight}</span>
                        </motion.li>
                      ))
                    ) : (
                      <p className="text-gray-400">
                        No additional insights available.
                      </p>
                    )}
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center justify-center h-96 p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
                className="bg-gray-700 bg-opacity-30 p-8 rounded-3xl border border-gray-600 mb-6 w-16 h-16 flex items-center justify-center"
              >
                <FaLeaf className="text-3xl text-green-400 opacity-70" />
              </motion.div>
              <h3 className="text-xl font-medium text-gray-300 mb-3">
                No Carbon Data Available
              </h3>
              <p className="text-gray-400 max-w-md mb-6">
                Please provide the necessary details for your carbon footprint
                analysis.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchCarbonFootprint}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Run Analysis
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default CarbonFootprint;
