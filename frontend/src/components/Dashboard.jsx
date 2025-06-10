import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaRoute,
  FaCheckCircle,
  FaBox,
  FaFileCsv,
  FaChartBar,
  FaMapMarkedAlt,
  FaLeaf,
  FaFileExport,
  FaUserCircle,
  FaBars,
  FaDollarSign,
  FaClock,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FeatureCarousel from "./FeatureCarousel";
import AppleStyleSideBackground from "./EnhancedBackground";
import AboutSection from "./AboutSection";
import Button from "./Button";

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

  // GradientButton with old code's color scheme
  const GradientButton = ({ children, ...props }) => (
    <motion.button
      {...props}
      className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold text-base sm:text-lg px-6 py-3 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
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

  const handleProfileClick = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/protectedRoute`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = response.data.user.id;
      navigate(`/profile/${userId}`);
    } catch (error) {
      console.error("Error navigating to profile:", error);
      navigate("/"); // Redirect to login if token is invalid
    }
  };

  const handleInventoryClick = () => {
    navigate("/inventory-management");
  };
  const handleNewsClick = () => {
    navigate("/news");
  };

  const handleDocsClick = () => {
    navigate("/docs");
  };

  const complianceCheck = () => {
    const token = localStorage.getItem("token");
    localStorage.clear();
    if (token) {
      localStorage.setItem("token", token);
    }
    navigate("/compliance");
  };

  const routeOptimization = () => {
    const token = localStorage.getItem("token");
    localStorage.clear();
    if (token) {
      localStorage.setItem("token", token);
    }
    navigate("/route-optimization");
  };

  const features = [
    {
      id: 1,
      title: "Route Optimization",
      description:
        "Leverage AI-powered insights to streamline cargo routes, cut costs, and boost delivery speed with intelligent planning.",
      icon: <FaRoute className="text-emerald-500" size={24} />,
      bgAccent: "bg-emerald-100/30",
      borderColor: "hover:border-emerald-200/50",
    },
    {
      id: 2,
      title: "Compliance Check",
      description:
        "Stay ahead of regulations with automated checks that ensure seamless, compliant logistics operations.",
      icon: <FaCheckCircle className="text-blue-500" size={24} />,
      bgAccent: "bg-blue-100/30",
      borderColor: "hover:border-blue-200/50",
    },
    {
      id: 3,
      title: "Inventory Management",
      description:
        "Efficiently track and manage your cargo inventory in real-time, ensuring optimal stock levels and minimizing delays.",
      icon: <FaBox className="text-purple-500" size={24} />,
      bgAccent: "bg-purple-100/30",
      borderColor: "hover:border-purple-200/50",
    },
    {
      id: 4,
      title: "Compliance Using CSV",
      description:
        "Upload CSV files to automate and simplify compliance checks, ensuring all shipments meet regulatory standards effortlessly.",
      icon: <FaFileCsv className="text-indigo-500" size={24} />,
      bgAccent: "bg-indigo-100/30",
      borderColor: "hover:border-indigo-200/50",
    },
    {
      id: 5,
      title: "Product Analysis",
      description:
        "Analyze product shipment data to identify trends, optimize logistics, and improve decision-making with actionable insights.",
      icon: <FaChartBar className="text-orange-500" size={24} />,
      bgAccent: "bg-orange-100/30",
      borderColor: "hover:border-orange-200/50",
    },
    {
      id: 6,
      title: "Map View",
      description:
        "Visualize your shipping routes on an interactive map, tracking progress and optimizing paths across land, sea, and air.",
      icon: <FaMapMarkedAlt className="text-teal-500" size={24} />,
      bgAccent: "bg-teal-100/30",
      borderColor: "hover:border-teal-200/50",
    },
    {
      id: 7,
      title: "Detailed Carbon Analysis",
      description:
        "Measure and analyze the carbon footprint of your shipments, enabling sustainable logistics with detailed emissions insights.",
      icon: <FaLeaf className="text-green-500" size={24} />,
      bgAccent: "bg-green-100/30",
      borderColor: "hover:border-green-200/50",
    },
    {
      id: 8,
      title: "Export Report",
      description:
        "Generate and export comprehensive reports on routes, compliance, and emissions for easy sharing and record-keeping.",
      icon: <FaFileExport className="text-red-500" size={24} />,
      bgAccent: "bg-red-100/30",
      borderColor: "hover:border-red-200/50",
    },
  ];

  return (
    <div className="bg-gray-50 text-gray-900 font-sans min-h-screen relative overflow-x-hidden">
      <AppleStyleSideBackground>
        {/* Navigation Bar with old code's colors */}
        <nav className="fixed top-0 left-4 right-4 mx-auto mt-6 max-w-6xl bg-white/80 backdrop-blur-xl border border-white/30 rounded-3xl shadow-lg shadow-black/5 z-50 flex justify-between items-center px-8 py-5 transition-all duration-300 hover:bg-white/85 hover:shadow-xl hover:shadow-black/10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight"
          >
            Smart
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              logix
            </span>
          </motion.h2>

          <div className="flex items-center">
            <div className="hidden md:flex items-center space-x-4">
              <motion.a
                onClick={handleDocsClick}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer text-gray-700 hover:text-blue-600 text-base font-medium px-4 py-2.5 rounded-2xl hover:bg-white/60 transition-all duration-200 relative backdrop-blur-sm"
              >
                Docs
              </motion.a>
              <motion.a
                onClick={handleNewsClick}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer text-gray-700 hover:text-blue-600 text-base font-medium px-4 py-2.5 rounded-2xl hover:bg-white/60 transition-all duration-200 relative backdrop-blur-sm"
              >
                News
              </motion.a>
              <motion.a
                href="#about"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="text-gray-700 hover:text-blue-600 text-base font-medium px-4 py-2.5 rounded-2xl hover:bg-white/60 transition-all duration-200 relative backdrop-blur-sm"
              >
                About
              </motion.a>
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center"
              >
                <Button onClick={handleInventoryClick} />
              </motion.div>
              <motion.button
                onClick={handleProfileClick}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer bg-white/70 hover:bg-white/90 text-gray-800 font-medium text-sm px-5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all duration-200 shadow-sm hover:shadow-md border border-white/40 backdrop-blur-sm"
              >
                <FaUserCircle size={16} className="text-blue-600" />
                Profile
              </motion.button>
            </div>

            <motion.button
              onClick={() => setShowSidebar(!showSidebar)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md:hidden w-10 h-10 rounded-2xl bg-white/70 hover:bg-white/90 flex items-center justify-center transition-all duration-200 shadow-sm border border-white/40 backdrop-blur-sm"
            >
              <FaBars size={18} className="text-gray-700" />
            </motion.button>
          </div>
        </nav>

        {/* Mobile Sidebar with old code's colors */}
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-md z-40 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="fixed top-6 left-4 h-[calc(100vh-3rem)] w-80 bg-white/85 backdrop-blur-xl border border-gray-200/50 rounded-3xl z-50 p-8 md:hidden shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-gray-900"
                >
                  Menu
                </motion.h2>
                <motion.button
                  onClick={() => setShowSidebar(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-gray-200/70 hover:bg-gray-300/90 flex items-center justify-center transition-all duration-200 shadow-sm border border-gray-200/40"
                >
                  <IoMdClose size={20} className="text-gray-900" />
                </motion.button>
              </div>
              <div className="space-y-3">
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="block text-base py-4 px-5 text-gray-900 hover:bg-gray-100/60 hover:text-gray-600 rounded-2xl transition-all duration-200 font-medium border border-transparent hover:border-gray-200/40"
                  onClick={handleDocsClick}
                >
                  Docs
                </motion.a>
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="block text-base py-4 px-5 text-gray-900 hover:bg-gray-100/60 hover:text-gray-600 rounded-2xl transition-all duration-200 font-medium border border-transparent hover:border-gray-200/40"
                  onClick={handleNewsClick}
                >
                  News
                </motion.a>
                <motion.a
                  href="#about"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="block text-base py-4 px-5 text-gray-900 hover:bg-gray-100/60 hover:text-gray-600 rounded-2xl transition-all duration-200 font-medium border border-transparent hover:border-gray-200/40"
                  onClick={() => setShowSidebar(false)}
                >
                  About
                </motion.a>
                <motion.a
                  onClick={() => {
                    handleInventoryClick();
                    setShowSidebar(false);
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="block text-base py-4 px-5 text-gray-900 hover:bg-gray-100/60 hover:text-gray-600 rounded-2xl transition-all duration-200 font-medium border border-transparent hover:border-gray-200/40"
                >
                  Inventory
                </motion.a>
                <motion.button
                  onClick={() => {
                    handleProfileClick();
                    setShowSidebar(false);
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-4 text-base py-4 px-5 text-gray-900 hover:bg-gray-100/60 hover:text-gray-600 rounded-2xl transition-all duration-200 font-medium border border-transparent hover:border-gray-200/40"
                >
                  <FaUserCircle size={18} className="text-gray-600" />
                  <span>Profile</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}

        {/* Header Section with Lottie Animation */}
        <section className="relative min-h-screen flex items-center z-10 pt-28 pb-16 px-4 sm:px-8 md:px-12">
          <div className="container mx-auto max-w-7xl relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5 }}
              className="w-full lg:w-1/2 text-center lg:text-left"
            >
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-gray-900"
              >
                Smart
                <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  logix
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="text-xl md:text-2xl max-w-2xl mx-auto lg:mx-0 mt-6 text-gray-600 leading-relaxed font-medium"
              >
                Innovating Logistics for the Future
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="mt-6 flex flex-col sm:flex-row justify-center lg:justify-start gap-6"
              >
                <GradientButton
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={complianceCheck}
                >
                  <FaCheckCircle className="text-lg" />
                  <span>Compliance Check</span>
                </GradientButton>
                <GradientButton
                  whileHover={{ scale: 1.05, rotate: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={routeOptimization}
                >
                  <FaRoute className="text-lg" />
                  <span>Route Optimization</span>
                </GradientButton>
              </motion.div>
            </motion.div>

            {/* <ResponsiveHide breakpoint={1280}> */}
            <div className="hidden lg:flex w-full lg:w-1/2">
              <FeatureCarousel features={features} />
            </div>
            {/* </ResponsiveHide> */}
          </div>
        </section>

        {/* About Section */}
        <AboutSection />

        {/* Problems We Solve Section from Old Code */}
        <section
          ref={solvesInView}
          className="py-12 sm:py-24 px-4 sm:px-6 relative z-10 bg-gray-50"
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
                className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
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

        {/* Footer with old code's colors */}
        <footer className="py-6 px-4 text-center relative z-10 bg-gray-50 border-t border-gray-200/50">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-gray-900 text-sm font-medium"
          >
            © {new Date().getFullYear()} Smartlogix. All rights reserved.
          </motion.p>
        </footer>
      </AppleStyleSideBackground>
    </div>
  );
}

export default MovexDashboard;
