import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaUserCircle,
  FaRoute,
  FaCheckCircle,
  FaDollarSign,
  FaClock,
  FaLeaf,
  FaBars,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function MovexDashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [user, setUser] = useState({ firstName: "", lastName: "", email: "" });
  const [solvesInView, solvesVisible] = useInView({ threshold: 0.2 });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      try {
        const response = await axios.get(`${BACKEND_URL}/protectedRoute`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser({
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          email: response.data.user.emailAddress,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/");
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="bg-white text-gray-900 font-sans min-h-screen relative rounded-lg overflow-x-hidden">
      {/* Circular Navigation Bar with Shadow */}
      <nav className="fixed top-0 left-0 right-0 mx-auto mt-4 max-w-3xl bg-white rounded-full shadow-lg z-50 flex justify-between items-center px-6 py-4">
        <motion.h1
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl sm:text-2xl font-bold text-gray-900"
        >
          Smartlogix
        </motion.h1>
        <div className="flex items-center">
          <div className="hidden md:flex space-x-4 items-center">
            <motion.a
              href="#about"
              whileHover={{ scale: 1.1, color: "#6B7280" }}
              className="text-gray-900 text-base"
            >
              About
            </motion.a>
            <motion.button
              onClick={handleProfileClick}
              whileHover={{ scale: 1.1, backgroundColor: "#D1D5DB" }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-200 text-gray-900 font-semibold text-base px-4 py-2 rounded-full flex items-center gap-2"
            >
              <FaUserCircle size={18} />
              Profile
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>
          </div>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden"
          >
            <FaBars size={24} className="text-gray-900" />
          </button>
        </div>
      </nav>

      {/* Rest of the component remains unchanged */}
      {/* Mobile Sidebar */}
      {showSidebar && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          className="fixed top-0 left-0 h-full w-64 bg-white z-50 p-4 md:hidden"
        >
          <button onClick={() => setShowSidebar(false)} className="mb-4">
            <IoMdClose size={24} className="text-gray-900" />
          </button>
          <motion.a
            href="#about"
            whileHover={{ scale: 1.1, color: "#6B7280" }}
            className="block text-base mb-4 text-gray-900"
            onClick={() => setShowSidebar(false)}
          >
            About
          </motion.a>
          <motion.button
            onClick={handleProfileClick}
            whileHover={{ scale: 1.1, color: "#6B7280" }}
            className="flex items-center gap-2 text-base mt-4 text-gray-900"
          >
            <FaUserCircle size={18} />
            <span>Profile</span>
          </motion.button>
        </motion.div>
      )}

      {/* Header Section */}
      <section className="relative min-h-screen flex items-center z-10 pt-20 pb-10">
        {/* Abstract Background (Logistics-related) */}
        <div className="absolute top-0 right-0 w-1/2 h-full z-0 hidden sm:block">
          <svg
            className="w-full h-full"
            viewBox="0 0 600 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Truck */}
            <rect x="50" y="400" width="100" height="50" fill="#E5E7EB" />
            <circle cx="100" cy="450" r="15" fill="#9CA3AF" />
            <circle cx="150" cy="450" r="15" fill="#9CA3AF" />
            <rect x="80" y="380" width="40" height="20" fill="#D1D5DB" />

            {/* Route Path */}
            <path
              d="M200 500 Q300 400 400 500"
              stroke="#A7F3D0"
              strokeWidth="4"
              strokeDasharray="10,10"
              fill="none"
            />

            {/* Cargo Box */}
            <rect x="450" y="350" width="60" height="60" fill="#D1D5DB" />
            <path
              d="M450 350 L510 410 M480 350 L480 410"
              stroke="#9CA3AF"
              strokeWidth="2"
            />

            {/* Compliance Checkmark */}
            <circle cx="300" cy="200" r="40" fill="#A7F3D0" opacity="0.5" />
            <path
              d="M280 200 L295 215 L320 190"
              stroke="#10B981"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Decorative Elements */}
            <circle cx="50" cy="300" r="10" fill="#E5E7EB" opacity="0.5" />
            <circle cx="500" cy="500" r="15" fill="#A7F3D0" opacity="0.5" />
          </svg>
        </div>

        {/* Content */}
        <div className="container mx-auto px-8">
          <div className="relative text-center sm:text-left max-w-xl sm:ml-0">
            <motion.h1
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 120 }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gray-900"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            >
              Smartlogix
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="text-lg sm:text-xl md:text-2xl max-w-md mt-4 text-gray-600 mx-auto sm:mx-0"
            >
              Innovating Logistics for the Future
            </motion.p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center sm:justify-start">
              <motion.button
                whileHover={{ scale: 1.15, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/compliance-check")}
                className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold text-base px-6 py-3 rounded-full flex items-center justify-center sm:justify-start gap-2 shadow-lg mx-auto sm:mx-0 w-full sm:w-auto"
              >
                <FaCheckCircle className="inline" /> Compliance Check
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/route-optimization")}
                className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold text-base px-6 py-3 rounded-full flex items-center justify-center sm:justify-start gap-2 shadow-lg mx-auto sm:mx-0 w-full sm:w-auto"
              >
                <FaRoute className="inline" /> Route Optimization
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-12 sm:py-24 px-4 sm:px-6 z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            About Smartlogix
          </motion.h2>
          <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
            Smartlogix is a cutting-edge logistics platform designed to
            streamline operations, reduce costs, and promote sustainability. By
            leveraging advanced technology, we empower businesses to navigate
            modern supply chain complexities with ease and precision.
          </p>
        </div>
      </section>

      {/* Problems We Solve Section */}
      <section
        ref={solvesInView}
        className="py-12 sm:py-24 px-4 sm:px-6 relative z-10"
        id="solves"
      >
        <motion.h2
          initial={{ opacity: 0 }}
          animate={solvesVisible ? { opacity: 1 } : {}}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-12"
        >
          Problems We Solve
        </motion.h2>
        <div className="max-w-5xl mx-auto space-y-8">
          {[
            {
              problem: "Inefficient Route Selection",
              icon: <FaRoute className="text-gray-600" />,
              solve: "Route Optimization",
            },
            {
              problem: "Compliance Complexities",
              icon: <FaCheckCircle className="text-gray-600" />,
              solve: "Compliance Check",
            },
            {
              problem: "High Operational Costs",
              icon: <FaDollarSign className="text-gray-600" />,
              solve: "Cost Optimization",
            },
            {
              problem: "Transit Delays",
              icon: <FaClock className="text-gray-600" />,
              solve: "Transit Time Optimization",
            },
            {
              problem: "Environmental Impact",
              icon: <FaLeaf className="text-gray-600" />,
              solve: "Carbon Emission Checker",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={solvesVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Problem Side */}
              <div className="flex-1 flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  {item.icon}
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Problem
                  </h3>
                  <p className="text-gray-600">{item.problem}</p>
                </div>
              </div>
              {/* Arrow */}
              <svg
                className="w-8 h-8 text-gray-400 hidden sm:block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              {/* Solution Side */}
              <div className="flex-1 flex items-center gap-4 sm:justify-end">
                <div className="text-right">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Solution
                  </h3>
                  <p className="text-gray-600">{item.solve}</p>
                </div>
                <motion.div
                  className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <FaCheckCircle className="text-emerald-500" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 text-center relative z-10 bg-gray-50">
        <p className="text-gray-900 text-sm">
          © {new Date().getFullYear()} Smartlogix. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default MovexDashboard;
