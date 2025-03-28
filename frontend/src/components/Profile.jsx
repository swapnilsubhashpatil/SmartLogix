import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
  });
  const [complianceHistory, setComplianceHistory] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("compliance"); // Add state for active tab
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await axios.get(
          "http://localhost:5000/protectedRoute",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUser(userResponse.data.user);

        const complianceResponse = await axios.get(
          "http://localhost:5000/api/compliance-history",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComplianceHistory(complianceResponse.data.complianceHistory);

        const routeResponse = await axios.get(
          "http://localhost:3003/api/route-history",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRouteHistory(routeResponse.data.routeHistory);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchUserData();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleDeleteCompliance = async (recordId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/compliance-history/${recordId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplianceHistory((prev) =>
        prev.filter((entry) => entry._id !== recordId)
      );
    } catch (error) {
      console.error("Error deleting compliance record:", error);
    }
  };

  const handleRouteOptimizationClick = () => {
    navigate("/route-optimization");
  };

  return (
    <div className="min-h-screen bg-neutral-100 font-sans text-tertiary-900 p-6">
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

      {/* Tabs Navigation */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex border-b border-neutral-200">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium text-lg ${
              activeTab === "compliance"
                ? "border-b-2 border-secondary-500 text-secondary-500"
                : "text-tertiary-700 hover:text-secondary-500"
            }`}
            onClick={() => setActiveTab("compliance")}
          >
            Compliance Check History
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium text-lg ${
              activeTab === "route"
                ? "border-b-2 border-secondary-500 text-secondary-500"
                : "text-tertiary-700 hover:text-secondary-500"
            }`}
            onClick={() => setActiveTab("route")}
          >
            Route Optimization History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {activeTab === "compliance" && (
          <div>
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
                    key={entry._id || index}
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
                        <div className="bg-neutral-200 p-3 rounded-lg text-sm text-tertiary-800">
                          {entry.formData.ShipmentDetails ? (
                            <div className="space-y-2">
                              <p>
                                <strong>Origin Country:</strong>{" "}
                                {
                                  entry.formData.ShipmentDetails[
                                    "Origin Country"
                                  ]
                                }
                              </p>
                              <p>
                                <strong>Destination Country:</strong>{" "}
                                {
                                  entry.formData.ShipmentDetails[
                                    "Destination Country"
                                  ]
                                }
                              </p>
                              <p>
                                <strong>HS Code:</strong>{" "}
                                {entry.formData.ShipmentDetails["HS Code"]}
                              </p>
                              <p>
                                <strong>Product Description:</strong>{" "}
                                {
                                  entry.formData.ShipmentDetails[
                                    "Product Description"
                                  ]
                                }
                              </p>
                              <p>
                                <strong>Quantity:</strong>{" "}
                                {entry.formData.ShipmentDetails["Quantity"]}
                              </p>
                              <p>
                                <strong>Gross Weight:</strong>{" "}
                                {entry.formData.ShipmentDetails["Gross Weight"]}{" "}
                                kg
                              </p>
                            </div>
                          ) : (
                            <p className="text-tertiary-600">
                              No shipment details available.
                            </p>
                          )}
                        </div>
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
          </div>
        )}

        {activeTab === "route" && (
          <div>
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
                    key={entry._id || index}
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
                        Saved
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-tertiary-600">
                          <strong>From:</strong> {entry.formData.from}
                        </p>
                        <p className="text-tertiary-600">
                          <strong>To:</strong> {entry.formData.to}
                        </p>
                        <p className="text-tertiary-600">
                          <strong>Weight:</strong> {entry.formData.weight} kg
                        </p>
                        <p className="text-tertiary-600">
                          <strong>Distance:</strong>{" "}
                          {entry.routeData.totalDistance} km
                        </p>
                        <p className="text-tertiary-600">
                          <strong>Carbon Emission:</strong>{" "}
                          {entry.routeData.totalCarbonEmission} kg
                        </p>
                      </div>
                      <div>
                        <h4 className="text-tertiary-700 font-medium mb-2">
                          Route Details
                        </h4>
                        <div className="bg-neutral-200 p-3 rounded-lg text-sm text-tertiary-800 space-y-2">
                          {entry.routeData.routeDirections.length > 0 ? (
                            entry.routeData.routeDirections.map((direction) => (
                              <div key={direction.id}>
                                <p className="font-medium">
                                  {direction.waypoints[0]} →{" "}
                                  {direction.waypoints[1]}
                                </p>
                                <p className="text-tertiary-600">
                                  Transport:{" "}
                                  {direction.state.charAt(0).toUpperCase() +
                                    direction.state.slice(1)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-tertiary-600">
                              No route directions available.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
};

export default Profile;
