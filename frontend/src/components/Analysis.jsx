import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Package,
  TrendingUp,
  Leaf,
  AlertTriangle,
  Truck,
  FileCheck,
  Globe,
  User,
  Inbox,
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import Header from "./Header";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Analysis = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [shipmentData, setShipmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("compliance");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDrafts = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!token) {
          setError("Please log in.");
          navigate("/");
          return;
        }

        const response = await axios.get(
          `${BACKEND_URL}/api/drafts/user/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              complianceStatus: "done",
              routeOptimizationStatus: "done",
            },
          }
        );

        setShipmentData(response.data.drafts || []);
      } catch (err) {
        console.error("Error fetching drafts:", err);
        setError(err.response?.data?.error || "Failed to fetch analysis data.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchDrafts();
  }, [userId, token, navigate]);

  // Analytics Calculations
  const analytics = React.useMemo(() => {
    if (!shipmentData.length) return {};

    const totalShipments = shipmentData.length;
    const totalCost = shipmentData.reduce(
      (sum, item) => sum + item.routeData.totalCost,
      0
    );
    const totalEmissions = shipmentData.reduce(
      (sum, item) =>
        sum +
        parseFloat(item.carbonAnalysis.totalEmissions.replace(" kg CO2e", "")),
      0
    );
    const avgRiskScore =
      shipmentData.reduce(
        (sum, item) => sum + item.complianceData.riskLevel.riskScore,
        0
      ) / totalShipments;

    // Routes for Compliance Tab
    const routes = shipmentData.map((item) => ({
      route: `${item.formData.ShipmentDetails["Origin Country"]}→${item.formData.ShipmentDetails["Destination Country"]}`,
      risk: item.complianceData.riskLevel.riskScore,
    }));

    // KPIs for Logistics Tab
    const kpis = {
      avgTime: (
        shipmentData.reduce((sum, item) => sum + item.routeData.totalTime, 0) /
          shipmentData.length || 0
      ).toFixed(2),
      avgCostPerKm: (
        shipmentData.reduce(
          (sum, item) =>
            sum + item.routeData.totalCost / item.routeData.totalDistance,
          0
        ) / shipmentData.length || 0
      ).toFixed(4),
      avgLegs:
        shipmentData.reduce(
          (sum, item) => sum + item.routeData.routeDirections.length,
          0
        ) / shipmentData.length || 0,
    };

    // Incoterms for Trade Tab
    const incoterms = shipmentData.reduce((acc, item) => {
      const term = item.formData.TradeAndRegulatoryDetails["Incoterms 2020"];
      acc[term] = (acc[term] || 0) + 1;
      return acc;
    }, {});

    // Emissions by Mode for Logistics Tab
    const emissionsByMode = shipmentData.map((item) => ({
      route: `${item.formData.ShipmentDetails["Origin Country"]}→${item.formData.ShipmentDetails["Destination Country"]}`,
      land: item.carbonAnalysis.routeAnalysis
        .filter((r) => r.mode === "land")
        .reduce(
          (sum, r) => sum + parseFloat(r.emissions.replace(" kg CO2e", "")),
          0
        ),
      sea: item.carbonAnalysis.routeAnalysis
        .filter((r) => r.mode === "sea")
        .reduce(
          (sum, r) => sum + parseFloat(r.emissions.replace(" kg CO2e", "")),
          0
        ),
      air: item.carbonAnalysis.routeAnalysis
        .filter((r) => r.mode === "air")
        .reduce(
          (sum, r) => sum + parseFloat(r.emissions.replace(" kg CO2e", "")),
          0
        ),
    }));

    return {
      totalShipments,
      totalCost,
      totalEmissions,
      avgRiskScore,
      routes,
      kpis,
      incoterms: Object.entries(incoterms).map(([name, value]) => ({
        name,
        value,
      })),
      emissionsByMode,
    };
  }, [shipmentData]);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      yellow: "from-yellow-500 to-yellow-600",
      red: "from-red-500 to-red-600",
      purple: "from-purple-500 to-purple-600",
    };

    return (
      <motion.div
        whileHover={{ scale: 1.05, shadow: 10 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text_gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div
            className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </motion.div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!loading && shipmentData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header title="Analysis" />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white mt-8 rounded-xl shadow-lg p-6 flex items-center justify-center flex-col"
          >
            <Inbox className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              None of your records are compliant and route optimized.For
              analysis, you need at least one record that is compliant and route
              optimized.
            </p>
            <button
              onClick={() => navigate("/inventory-management")} // Adjust the route as per your app's routing
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Inventory
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Header title="Analysis" />
      {loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 1 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, staggerChildren: 0.1 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <StatCard
              icon={Package}
              title="Total Shipments"
              value={analytics.totalShipments}
              color="blue"
            />
            <StatCard
              icon={TrendingUp}
              title="Total Cost"
              value={`$${
                parseInt(analytics.totalCost)?.toLocaleString() || "0"
              }`}
              subtitle="Shipping costs"
              color="yellow"
            />
            <StatCard
              icon={Leaf}
              title="CO2 Emissions"
              value={`${analytics.totalEmissions?.toFixed(1) || "0"} kg CO2e`}
              subtitle="Total footprint"
              color="red"
            />
            <StatCard
              icon={AlertTriangle}
              title="Avg Risk Score"
              value={analytics.avgRiskScore?.toFixed(1) || "0"}
              subtitle="Compliance risk"
              color="purple"
            />
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white max-w-1/3 mx-auto rounded-lg shadow-lg p-4 mb-8"
          >
            <nav
              className="flex align-center justify-center space-x-4"
              role="tablist"
            >
              {[
                { label: "Compliance", value: "compliance", icon: FileCheck },
                { label: "Trade", value: "trade", icon: Globe },
                { label: "Logistics", value: "logistics", icon: Truck },
              ].map(({ label, value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === value
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                  role="tab"
                  aria-current={activeTab === value ? "page" : undefined}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            {activeTab === "compliance" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileCheck className="w-5 h-5 mr-2" />
                  Compliance Overview
                </h3>
                <div className="mt-8 mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Risk by Route
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4">Route</th>
                          <th className="text-left py-3 px-4">Risk Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.routes?.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">{r.route}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  r.risk <= 20
                                    ? "bg-green-100 text-green-800"
                                    : r.risk <= 40
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {r.risk} (
                                {r.risk <= 20
                                  ? "Low"
                                  : r.risk <= 40
                                  ? "Moderate"
                                  : "High"}
                                )
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Compliance Scorecard
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4">Route</th>
                          <th className="text-left py-3 px-4">
                            Shipment Details
                          </th>
                          <th className="text-left py-3 px-4">
                            Trade & Regulatory
                          </th>
                          <th className="text-left py-3 px-4">
                            Parties & Identifiers
                          </th>
                          <th className="text-left py-3 px-4">Logistics</th>
                          <th className="text-left py-3 px-4">Intended Use</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipmentData.map((d) => (
                          <tr
                            key={d._id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">{`${d.formData.ShipmentDetails["Origin Country"]}→${d.formData.ShipmentDetails["Destination Country"]}`}</td>
                            <td className="py-3 px-4">
                              {d.complianceData.scores.ShipmentDetails}
                            </td>
                            <td className="py-3 px-4">
                              {
                                d.complianceData.scores
                                  .TradeAndRegulatoryDetails
                              }
                            </td>
                            <td className="py-3 px-4">
                              {d.complianceData.scores.PartiesAndIdentifiers}
                            </td>
                            <td className="py-3 px-4">
                              {d.complianceData.scores.LogisticsAndHandling}
                            </td>
                            <td className="py-3 px-4">
                              {d.complianceData.scores.IntendedUseDetails}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Best Practices
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    <li>
                      Switch air to sea freight for 90% emissions reduction
                      where time allows.
                    </li>
                    <li>Consolidate shipments to reduce per-unit emissions.</li>
                    <li>
                      Ensure MSDS for hazardous materials to avoid compliance
                      issues.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "trade" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Trade & Regulatory Insights
                </h3>
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Incoterms Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.incoterms}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Incoterms Impact
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4">Incoterms</th>
                          <th className="text-left py-3 px-4">Cost Impact</th>
                          <th className="text-left py-3 px-4">Risk Impact</th>
                          <th className="text-left py-3 px-4">
                            Compliance Responsibility
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">FOB</td>
                          <td className="py-3 px-4">Moderate</td>
                          <td className="py-3 px-4">Low</td>
                          <td className="py-3 px-4">Seller (until loaded)</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">CIF</td>
                          <td className="py-3 px-4">High</td>
                          <td className="py-3 px-4">Moderate</td>
                          <td className="py-3 px-4">Seller (until port)</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">DDP</td>
                          <td className="py-3 px-4">High</td>
                          <td className="py-3 px-4">High</td>
                          <td className="py-3 px-4">Seller (full)</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">EXW</td>
                          <td className="py-3 px-4">Low</td>
                          <td className="py-3 px-4">Low</td>
                          <td className="py-3 px-4">Buyer (full)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "logistics" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Logistics & Route Optimization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Avg Transit Time
                    </h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.kpis?.avgTime} hours
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Avg Cost per km
                    </h4>
                    <p className="text-2xl font-bold text-gray-900">
                      ${analytics.kpis?.avgCostPerKm}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Avg Legs
                    </h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.kpis?.avgLegs}
                    </p>
                  </div>
                </div>
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Route Details
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4">Route</th>
                          <th className="text-left py-3 px-4">Distance (km)</th>
                          <th className="text-left py-3 px-4">Mode</th>
                          <th className="text-left py-3 px-4">Cost ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipmentData.map((d) => (
                          <tr
                            key={d._id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">{`${d.formData.ShipmentDetails["Origin Country"]}→${d.formData.ShipmentDetails["Destination Country"]}`}</td>
                            <td className="py-3 px-4">
                              {d.routeData.totalDistance}
                            </td>
                            <td className="py-3 px-4">
                              {
                                d.formData.LogisticsAndHandling[
                                  "Means of Transport"
                                ]
                              }
                            </td>
                            <td className="py-3 px-4">
                              {d.routeData.totalCost}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Emissions by Mode
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.emissionsByMode}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="route" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value} kg CO2e`} />
                      <Bar dataKey="land" fill="#9CA3AF" stackId="a" />
                      <Bar dataKey="sea" fill="#3B82F6" stackId="a" />
                      <Bar dataKey="air" fill="#EF4444" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Earth Impact
                  </h4>
                  {shipmentData.map((d) => (
                    <p key={d._id} className="text-sm text-gray-600 mb-2">
                      {`${d.formData.ShipmentDetails["Origin Country"]}→${d.formData.ShipmentDetails["Destination Country"]}`}
                      : {d.carbonAnalysis.earthImpact}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Analysis;
