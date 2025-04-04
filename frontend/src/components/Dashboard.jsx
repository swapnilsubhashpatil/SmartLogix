import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaUserCircle,
  FaLightbulb,
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

  function ResponsiveHide({ breakpoint = 768, children }) {
    const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(
      window.innerWidth < breakpoint
    );

    useEffect(() => {
      const handleResize = () => {
        setIsBelowBreakpoint(window.innerWidth < breakpoint);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [breakpoint]);

    return isBelowBreakpoint ? null : children;
  }

  const GradientButton = ({ children, ...props }) => (
    <motion.button
      {...props}
      className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold text-base sm:text-lg px-6 py-3 rounded-full flex items-center justify-center gap-2 shadow-lg"
    >
      {children}
    </motion.button>
  );

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

  const complianceCheck = () => {
    const token = localStorage.getItem("token");

    // Clear localStorage
    localStorage.clear();

    // Restore the token
    if (token) {
      localStorage.setItem("token", token);
    }

    navigate("/compliance-check");
  };

  const routeOptimization = () => {
    const token = localStorage.getItem("token");

    // Clear localStorage
    localStorage.clear();

    // Restore the token
    if (token) {
      localStorage.setItem("token", token);
    }

    navigate("/route-optimization");
  };

  return (
    <div className="bg-white text-gray-900 font-sans min-h-screen relative rounded-lg overflow-x-hidden">
      {/* Circular Navigation Bar with Shadow */}
      <nav className="fixed top-0 left-4 right-4  mx-auto mt-6 max-w-5xl bg-white rounded-full shadow-lg z-50 flex justify-between items-center px-6 py-3">
        <motion.h1
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl sm:text-2xl font-bold text-gray-900"
        >
          Smartlogix
        </motion.h1>
        <div className="flex items-center">
          <div className="hidden md:flex space-x-4 items-center">
            <motion.a
              href="#about"
              whileHover={{ scale: 1.1, color: "#6B7280" }}
              className="text-gray-600 text-base font-medium"
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

      {/* Mobile Sidebar */}
      {showSidebar && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.3 }}
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
      <section className="relative min-h-screen flex items-center z-10 pt-24 pb-10 overflow-hidden">
        {/* Content */}
        <div className="container mx-auto px-4 sm:px-8 relative z-10 flex flex-col lg:flex-row items-center justify-between">
          {/* Left Side: Headline and Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="w-full lg:w-1/2 text-center lg:text-left mb-10 lg:mb-0"
          >
            <motion.h1
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 120 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-gray-900"
              style={{
                textShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              Smartlogix
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="text-xl md:text-2xl max-w-xl mx-auto lg:mx-0 mt-4 text-gray-600"
            >
              Innovating Logistics for the Future
            </motion.p>
            <div className="mt-12 flex flex-col sm:flex-row justify-center lg:justify-start gap-8">
              <GradientButton
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={complianceCheck}
              >
                <FaCheckCircle className="inline mr-2" /> Compliance Check
              </GradientButton>
              <GradientButton
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={routeOptimization}
              >
                <FaRoute className="inline mr-2" /> Route Optimization
              </GradientButton>
            </div>
          </motion.div>

          {/* Right Side: Feature Highlights */}

          <ResponsiveHide breakpoint={1280}>
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-centre space-y-8 sm:bg-gray-50 sm:p-6 sm:rounded-3xl sm:shadow-sm">
              {/* Feature Card: Route Optimization */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
                }}
                className="bg-white rounded-3xl shadow-md p-6 w-full max-w-sm border border-gray-100 hover:border-emerald-200 transition-colors duration-300"
              >
                <div className="flex items-center mb-3">
                  <FaRoute className="text-emerald-500 mr-2" size={20} />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Route Optimization
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Leverage AI-powered insights to streamline cargo routes, cut
                  costs, and boost delivery speed.
                </p>
              </motion.div>

              {/* Feature Card: Compliance Check */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.6 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
                }}
                className="bg-white rounded-3xl shadow-md p-6 w-full max-w-sm border border-gray-100 hover:border-blue-200 transition-colors duration-300"
              >
                <div className="flex items-center mb-3">
                  <FaCheckCircle className="text-blue-500 mr-2" size={20} />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Compliance Check
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Stay ahead of regulations with automated checks that ensure
                  seamless, compliant logistics.
                </p>
              </motion.div>
            </div>
          </ResponsiveHide>
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
