import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // For redirecting after logout

const Profile = () => {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
  });
  const [complianceHistory, setComplianceHistory] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await axios.get(
          "http://localhost:5000/protectedRoute",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(userResponse.data.user);

        const complianceResponse = await axios.get(
          "http://localhost:5000/api/compliance-history",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setComplianceHistory(complianceResponse.data.complianceHistory);

        // Placeholder for route history
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchUserData();
  }, [token]);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token from localStorage
    navigate("/"); // Redirect to login page (adjust path as needed)
  };

  // Delete Compliance Record Handler
  const handleDeleteCompliance = async (recordId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/compliance-history/${recordId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComplianceHistory((prev) =>
        prev.filter((entry) => entry._id !== recordId)
      );
    } catch (error) {
      console.error("Error deleting compliance record:", error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 font-sans text-tertiary-900 p-6">
      {/* Profile Section */}
      <motion.section
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto mb-12"
      >
        <div className="bg-gradient-to-r from-primary-500 to-primary-300 text-neutral-50 rounded-xl shadow-custom-medium p-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center text-4xl font-bold text-primary-500">
              {user.firstName?.charAt(0)}
              {user.lastName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-4xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-lg opacity-80">{user.emailAddress}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-secondary-500 hover:bg-secondary-600 text-neutral-50 font-medium py-2 px-4 rounded-custom transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </motion.section>

      {/* Compliance Check History Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-4xl mx-auto mb-12"
      >
        <h2 className="text-3xl font-semibold text-secondary-500 mb-6">
          Compliance Check History
        </h2>
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {complianceHistory.length === 0 ? (
            <p className="text-neutral-700 text-center">
              No compliance checks yet.
            </p>
          ) : (
            complianceHistory.map((entry, index) => (
              <motion.div
                key={entry._id || index} // Use _id if available from MongoDB
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-neutral-50 rounded-xl shadow-custom-light p-6 border-l-4 border-secondary-500"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-tertiary-700">
                    Check #{index + 1} -{" "}
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </h3>
                  <div className="flex space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        entry.complianceResponse.complianceStatus ===
                        "Ready for Shipment"
                          ? "bg-secondary-200 text-secondary-800"
                          : "bg-primary-200 text-primary-800"
                      }`}
                    >
                      {entry.complianceResponse.complianceStatus}
                    </span>
                    <button
                      onClick={() => handleDeleteCompliance(entry._id)}
                      className="bg-primary-500 hover:bg-primary-600 text-neutral-50 font-medium py-1 px-3 rounded-custom transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-tertiary-600">
                      <strong>Risk Score:</strong>{" "}
                      {entry.complianceResponse.riskLevel.riskScore}
                    </p>
                    <p className="text-tertiary-600">
                      <strong>Summary:</strong>{" "}
                      {entry.complianceResponse.summary}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-tertiary-700 font-medium mb-2">
                      Shipment Details
                    </h4>
                    <pre className="bg-neutral-200 p-3 rounded-lg text-sm text-tertiary-800 overflow-x-auto">
                      {JSON.stringify(entry.formData.ShipmentDetails, null, 2)}
                    </pre>
                  </div>
                </div>
                {entry.complianceResponse.violations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-primary-600 font-medium">
                      Violations:
                    </h4>
                    <ul className="list-disc pl-5 text-sm text-tertiary-700">
                      {entry.complianceResponse.violations.map((v, i) => (
                        <li key={i}>
                          {v.field}: {v.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.section>

      {/* Route Optimization History Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-3xl font-semibold text-secondary-500 mb-6">
          Route Optimization History
        </h2>
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {routeHistory.length === 0 ? (
            <p className="text-neutral-700 text-center">
              No route optimizations yet.
            </p>
          ) : (
            routeHistory.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-neutral-50 rounded-xl shadow-custom-light p-6 border-l-4 border-primary-500"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-tertiary-700">
                    Route #{index + 1} -{" "}
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </h3>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-secondary-200 text-secondary-800">
                    {entry.status || "Optimized"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-tertiary-600">
                      <strong>Distance:</strong> {entry.distance || "N/A"} km
                    </p>
                    <p className="text-tertiary-600">
                      <strong>Duration:</strong> {entry.duration || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-tertiary-700 font-medium mb-2">
                      Route Details
                    </h4>
                    <pre className="bg-neutral-200 p-3 rounded-lg text-sm text-tertiary-800 overflow-x-auto">
                      {JSON.stringify(entry.routeDetails || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default Profile;
