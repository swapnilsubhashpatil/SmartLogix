import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { FaUserCircle, FaSignOutAlt, FaLeaf, FaUser } from "react-icons/fa";
import Toast from "./Toast";
import Header from "./Header";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    profilePhoto: ``,
  });
  const [badge, setBadge] = useState({ tier: "Bronze", score: 0, details: {} });
  const [loading, setLoading] = useState(true);
  const [status, showBadge] = useState(true);

  const [toastProps, setToastProps] = useState({ type: "", message: "" });
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch user data
        const userResponse = await axios.get(`${BACKEND_URL}/protectedRoute`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userResponse.data.user);
        console.log(userResponse.data.user);

        // Fetch drafts for carbon score calculation
        const draftsResponse = await axios.get(`${BACKEND_URL}/api/drafts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const drafts = draftsResponse.data.drafts || [];
        console.log("Total drafts:", drafts.length);

        // Filter drafts that are both compliant and done
        const compliantAndDoneDrafts = drafts.filter(
          (draft) =>
            draft.statuses?.compliance === "compliant" &&
            draft.statuses?.routeOptimization === "done"
        );
        console.log(
          "Compliant and done drafts:",
          compliantAndDoneDrafts.length
        );

        // Calculate badge metrics based on carbon efficiency from filtered drafts
        if (compliantAndDoneDrafts.length === 0) {
          showBadge(false); // No compliant and done drafts found, hide badge
          return;
        }

        // Calculate mean totalCarbonScore from filtered drafts (assuming 0-100 range)
        const totalCarbonScore = compliantAndDoneDrafts.reduce(
          (sum, draft) =>
            sum + (parseFloat(draft.routeData?.totalCarbonScore) || 0),
          0
        );
        const meanCarbonScore =
          totalCarbonScore / compliantAndDoneDrafts.length;
        const carbonEfficiency = 100 - meanCarbonScore; // Lower score = higher efficiency

        // Determine badge tier based on carbon efficiency
        let tier = "Eco Learner";
        if (carbonEfficiency >= 90) tier = "Eco Champion";
        else if (carbonEfficiency >= 75) tier = "Green Advocate";
        else if (carbonEfficiency >= 50) tier = "Sustainable Starter";

        setBadge({
          tier,
          score: carbonEfficiency.toFixed(1),
          details: {
            carbonEfficiency: carbonEfficiency.toFixed(1),
          },
        });
        showBadge(true); // Show badge since we have valid data
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setToastProps({
          type: "error",
          message: "Failed to load profile data.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [token]);

  const handleLogout = () => {
    setToastProps({
      type: "success",
      message: "You have successfully logged out!",
    });
    setTimeout(() => {
      navigate("/");
      localStorage.removeItem("token");
    }, 2000);
  };

  const handleNavigation = (path) => {
    navigate(`/${path}/${userId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6">
      <Header title="Profile" />
      {loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          {/* User Info Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover shadow-lg"
                      onError={(e) => {
                        console.error("Failed to load profile photo:", e);
                        e.target.src = "/placeholder-image.jpg";
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <FaUser className="text-4xl text-white" />
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-gray-600 text-lg mb-1">
                    {user.emailAddress}
                  </p>
                  {/* Badge */}

                  {status && (
                    <div className="group relative inline-flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          badge.tier === "Eco Champion"
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-700 text-white"
                            : badge.tier === "Green Advocate"
                            ? "bg-gradient-to-r from-lime-400 to-lime-600 text-lime-900"
                            : badge.tier === "Sustainable Starter"
                            ? "bg-gradient-to-r from-yellow-300 to-lime-400 text-lime-800"
                            : "bg-gradient-to-r from-gray-300 to-green-300 text-green-800"
                        }`}
                      >
                        <FaLeaf className="mr-1" /> {badge.tier}
                      </span>
                      {/* Hover Tooltip */}
                      <div className="absolute hidden group-hover:block top-full mt-2 w-64 bg-green-800 text-white text-sm rounded-lg p-4 shadow-lg z-10">
                        <p className="font-semibold mb-2">
                          Your Carbon Efficiency:
                        </p>
                        <p>Score: {badge.details.carbonEfficiency}%</p>
                        <p className="mt-2 italic">
                          {badge.tier === "Eco Champion"
                            ? "You're an Eco Champion! Your routes are incredibly sustainable—keep leading the way for a greener planet! 🌍"
                            : badge.tier === "Green Advocate"
                            ? "Great work, Green Advocate! Optimize more routes to lower your carbon footprint even further! 🍃"
                            : badge.tier === "Sustainable Starter"
                            ? "Nice start, Sustainable Starter! Try consolidating shipments or choosing greener transport modes to improve! 🌱"
                            : "You're an Eco Learner! Focus on reducing emissions by optimizing routes and using eco-friendly transport! 🌿"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm"
              >
                <FaSignOutAlt className="text-sm" /> Logout
              </motion.button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation("manage-account")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-4 rounded-xl shadow-lg transition-all duration-200"
            >
              Manage Account
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation("history")}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-4 rounded-xl shadow-lg transition-all duration-200"
            >
              History
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled
              onClick={() => handleNavigation("analysis")}
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-4 rounded-xl shadow-lg transition-all duration-200"
            >
              Analysis
            </motion.button>
          </div>
        </motion.div>
      )}

      <Toast type={toastProps.type} message={toastProps.message} />
    </div>
  );
};

export default Profile;
