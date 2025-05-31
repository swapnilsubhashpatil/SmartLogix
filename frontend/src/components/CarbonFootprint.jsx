import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaLeaf, FaTimes } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Toast from "./Toast";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function CarbonFootprint() {
  const [carbonData, setCarbonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastProps, setToastProps] = useState({ type: "", message: "" });
  const navigate = useNavigate();
  const { draftId } = useParams(); // Get draftId from URL params

  const showToast = (type, message) => {
    setToastProps({ type, message });
    setTimeout(() => setToastProps({ type: "", message: "" }), 3000);
  };

  useEffect(() => {
    const fetchCarbonData = async () => {
      setLoading(true);
      setCarbonData(null);
      setError(null);

      try {
        if (!draftId) {
          throw new Error("No draft ID provided in URL");
        }

        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        const response = await axios.get(
          `${BACKEND_URL}/api/carbon-footprint/${draftId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCarbonData(response.data);
      } catch (err) {
        console.error("Error fetching carbon footprint:", err);
        setError(err.message);
        showToast("error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCarbonData();
  }, [draftId]);

  const handleClose = () => {
    window.close(); // Close the tab
  };

  const chartData = carbonData?.routeAnalysis
    ? {
        labels: carbonData.routeAnalysis.map(
          (leg) => `${leg.leg} (${leg.mode})`
        ),
        datasets: [
          {
            label: "CO2e Emissions (kg)",
            data: carbonData.routeAnalysis.map((leg) =>
              parseFloat(leg.emissions.replace(" kg CO2e", ""))
            ),
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Carbon Emissions by Route Leg" },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "kg CO2e" } },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-6 md:p-10">
      <Toast type={toastProps.type} message={toastProps.message} />
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleClose}
          className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
          aria-label="Close"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto relative"
      >
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4 font-inter"
          >
            SmartLogix Carbon{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-300">
              Footprint
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto font-light"
          >
            Visualize your route’s carbon impact and its effect on Earth.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-gray-800 rounded-3xl p-6 md:p-10 border border-gray-700 shadow-2xl"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-20 h-20 mb-6"
              >
                <FaLeaf className="w-full h-full text-green-400" />
              </motion.div>
              <p className="text-green-300 text-lg font-medium">
                Loading carbon footprint data...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
              <FaLeaf className="text-3xl text-green-400 opacity-70 mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-3">
                {error}
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Close
              </motion.button>
            </div>
          ) : carbonData ? (
            <>
              {/* Summary */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  Carbon Footprint Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Total Distance</p>
                    <p className="text-2xl font-bold">
                      {carbonData.totalDistance}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Total Emissions</p>
                    <p className="text-2xl font-bold text-red-400">
                      {carbonData.totalEmissions}
                    </p>
                  </div>
                </div>
              </div>

              {/* Graph */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">Emissions Breakdown</h3>
                {chartData && <Bar data={chartData} options={chartOptions} />}
              </div>

              {/* Route Analysis */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">Route Analysis</h3>
                <div className="space-y-4">
                  {carbonData.routeAnalysis.map((leg, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-xl font-semibold text-green-300">
                        {leg.leg}: {leg.origin} → {leg.destination}
                      </h4>
                      <p>Mode: {leg.mode}</p>
                      <p>Distance: {leg.distance}</p>
                      <p className="text-red-400">Emissions: {leg.emissions}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earth Impact */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">Impact on Earth</h3>
                <div className="bg-gray-700 p-6 rounded-lg text-center">
                  <svg className="w-32 h-32 mx-auto mb-4" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="#1e3a8a" />
                    <path
                      d="M30 50 C40 20, 60 20, 70 50 C60 80, 40 80, 30 50"
                      fill="#10b981"
                    />
                    <path
                      d="M50 30 C70 40, 70 60, 50 70 C30 60, 30 40, 50 30"
                      fill="#34d399"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255, 99, 132, 0.5)"
                      strokeWidth="5"
                      animate={{ r: [45, 50, 45] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </svg>
                  <p className="text-lg text-gray-300">
                    {carbonData.earthImpact}
                  </p>
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <h3 className="text-2xl font-bold mb-4">Suggestions</h3>
                <ul className="bg-gray-700 p-4 rounded-lg space-y-2">
                  {carbonData.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-96">
              <FaLeaf className="text-3xl text-green-400 mb-4" />
              <p>No carbon data available. Please run an analysis.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default CarbonFootprint;
