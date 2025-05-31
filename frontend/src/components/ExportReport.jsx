import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MapView from "./MapView";
import {
  Home,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Truck,
  Ship,
  Plane,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Warning } from "@mui/icons-material";
import {
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import HomeIcon from "@mui/icons-material/Home";
import Header from "./Header";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Error Boundary Component for ComplianceResponse
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          Something went wrong displaying the compliance results. Please try
          again.
        </div>
      );
    }
    return this.props.children;
  }
}

// ComplianceResponse Component
const ComplianceResponse = ({ response }) => {
  if (!response || Object.keys(response).length === 0) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
        No compliance results available.
      </div>
    );
  }

  const complianceStatus = response.complianceStatus ?? "Not Ready";
  const summary = response.summary ?? "No summary provided";
  const violations = response.violations ?? [];
  const recommendations = response.recommendations ?? [];
  const additionalTips = response.additionalTips ?? [];

  const riskLevel = response.riskLevel ?? {
    riskScore: 0,
    summary: "No risk assessment available",
  };

  const scores = response.scores ?? {};

  const chartData = [
    { name: "Shipment Details", score: scores.ShipmentDetails || 0 },
    {
      name: "Trade & Regulatory",
      score: scores.TradeAndRegulatoryDetails || 0,
    },
    { name: "Parties & Identifiers", score: scores.PartiesAndIdentifiers || 0 },
    { name: "Logistics & Handling", score: scores.LogisticsAndHandling || 0 },
    { name: "Intended Use", score: scores.IntendedUseDetails || 0 },
  ];

  return (
    <ErrorBoundary>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div>
          {/* Header */}
          <h2 className="text-3xl font-bold text-indigo-700 mb-6 flex items-center">
            <span className="mr-2">
              {complianceStatus === "Ready for Shipment" ? (
                <CheckCircle
                  className="text-green-500"
                  style={{ width: "2rem", height: "2rem" }}
                />
              ) : (
                <Warning
                  className="text-red-500"
                  style={{ width: "2rem", height: "2rem" }}
                />
              )}
            </span>
            Compliance Check Results
          </h2>

          {/* Compliance Status */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Status</h3>
            <span
              className={`inline-block px-4 py-2 mt-2 rounded-full text-white font-medium ${
                riskLevel.riskScore < 30
                  ? "bg-green-500"
                  : riskLevel.riskScore < 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            >
              {complianceStatus}
            </span>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Summary</h3>
            <p className="mt-2 text-gray-600">{summary}</p>
          </div>

          {/* Risk Level */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Risk Level</h3>
            <div className="mt-2">
              <p className="text-gray-600">
                Risk Score: {riskLevel.riskScore}/100
              </p>
              <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                <div
                  style={{ width: `${riskLevel.riskScore}%` }}
                  className={`h-4 rounded-full ${
                    riskLevel.riskScore < 30
                      ? "bg-green-500"
                      : riskLevel.riskScore < 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
              <p className="mt-2 text-gray-600">{riskLevel.summary}</p>
            </div>
          </div>

          {/* Violations and Recommendations */}
          {(violations.length > 0 || recommendations.length > 0) && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Issues & Recommendations
              </h3>
              <div className="mt-2">
                <table className="min-w-full bg-white rounded-lg shadow-sm">
                  <thead>
                    <tr className="bg-indigo-100">
                      <th className="px-4 py-2 text-left text-indigo-700">
                        Field
                      </th>
                      <th className="px-4 py-2 text-left text-indigo-700">
                        Violation
                      </th>
                      <th className="px-4 py-2 text-left text-indigo-700">
                        Recommendation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {violations.map((violation, index) => {
                      const matchingRecommendation = recommendations.find(
                        (rec) => rec.field === violation.field
                      );
                      return (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2 text-gray-800">
                            {violation.field || "Unknown"}
                          </td>
                          <td className="px-4 py-2 text-red-600">
                            {violation.message || "No message"}
                          </td>
                          <td className="px-4 py-2 text-green-600">
                            {matchingRecommendation?.message || "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scores */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Compliance Scores
            </h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <RechartsBar dataKey="score" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Additional Tips */}
          {additionalTips.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                Additional Tips
              </h3>
              <ul className="mt-2 space-y-2">
                {additionalTips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-indigo-500 mr-2">•</span>
                    <span className="text-gray-600">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Main ExportReport Component
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function ExportReport() {
  const { draftId } = useParams();
  const [user, setUser] = useState("");
  const [draft, setDraft] = useState(null);
  const [carbonData, setCarbonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carbonLoading, setCarbonLoading] = useState(false);
  const navigate = useNavigate();

  const toHome = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");
        const userResponse = await axios.get(`${BACKEND_URL}/protectedRoute`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(
          userResponse.data.user.firstName +
            " " +
            userResponse.data.user.lastName
        );
      } catch (err) {
        setError(err.message);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchDraftData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!draftId) throw new Error("No draft ID provided in URL");
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");
        const response = await axios.get(
          `${BACKEND_URL}/api/drafts/${draftId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDraft(response.data.draft);
      } catch (err) {
        setError(`Failed to load draft data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchDraftData();
  }, [draftId]);

  useEffect(() => {
    const fetchAndGenerateCarbonData = async () => {
      setCarbonLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        try {
          const carbonResponse = await axios.get(
            `${BACKEND_URL}/api/carbon-footprint/${draftId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setCarbonData(carbonResponse.data);
          return;
        } catch (getError) {
          if (getError.response?.status !== 404) {
            throw getError;
          }
        }

        const carbonResponse = await axios.post(
          `${BACKEND_URL}/api/carbon-footprint`,
          {
            draftId: draftId,
            origin: draft.formData.ShipmentDetails["Origin Country"],
            destination: draft.formData.ShipmentDetails["Destination Country"],
            distance: draft.routeData.totalDistance,
            weight: parseFloat(draft.formData.ShipmentDetails["Gross Weight"]),
            routeDirections: draft.routeData.routeDirections,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCarbonData(carbonResponse.data);
      } catch (err) {
        console.error("Error with carbon footprint data:", err);
        setCarbonData(null);
      } finally {
        setCarbonLoading(false);
      }
    };

    if (draft) fetchAndGenerateCarbonData();
  }, [draftId, draft]);

  const exportToPDF = () => {
    // Add print-specific styles dynamically
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        /* Hide navbar and UI footer */
        header, footer {
          display: none !important;
        }
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
        }
        .page-break {
          page-break-before: always;
        }
      }
    `;
    document.head.appendChild(style);

    // Temporarily hide the navbar and UI footer
    const navbar = document.querySelector("header");
    const uiFooter = document.querySelector("footer");
    if (navbar) navbar.style.display = "none";
    if (uiFooter) uiFooter.style.display = "none";

    // Trigger the print dialog
    window.print();

    // Restore the navbar and UI footer visibility after printing
    if (navbar) navbar.style.display = "block";
    if (uiFooter) uiFooter.style.display = "block";

    // Remove the print styles after printing
    document.head.removeChild(style);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !draft || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-6 rounded-2xl shadow-xl">
          <p className="text-rose-600 mb-4 font-medium">
            {error ||
              "Draft not found. Please check the draft ID and try again."}
          </p>
          <button
            className="bg-amber-400 py-2 px-6 rounded-full shadow-md hover:bg-amber-500 transition-colors duration-300 text-gray-800 font-semibold"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (
    !draft.formData ||
    !draft.formData.ShipmentDetails ||
    !draft.formData.TradeAndRegulatoryDetails ||
    !draft.formData.PartiesAndIdentifiers ||
    !draft.formData.LogisticsAndHandling ||
    !draft.formData.DocumentVerification ||
    !draft.formData.IntendedUseDetails
  ) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-6 rounded-2xl shadow-xl">
          <p className="text-rose-600 mb-4 font-medium">
            Incomplete draft data. Form data is missing or invalid.
          </p>
          <button
            className="bg-amber-400 py-2 px-6 rounded-full shadow-md hover:bg-amber-500 transition-colors duration-300 text-gray-800 font-semibold"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const generationDate = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Chart data for carbon emissions
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
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Carbon Emissions by Route Leg" },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "kg CO2e" } },
    },
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6 flex flex-col">
      <Header title="Export Report" page="export" />

      <div className="max-w-5xl mx-auto my-10 bg-white shadow-2xl rounded-3xl overflow-hidden flex-grow">
        {/* Page 1: Header, Shipment Summary, and Product Analysis */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <h1 className="text-4xl font-bold tracking-tight">Export Report</h1>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <p className="text-lg">
              Prepared for:{" "}
              <span className="font-semibold">{user || "User"}</span>
            </p>
            <p className="text-lg">
              Generated on:{" "}
              <span className="font-semibold">{generationDate}</span>
            </p>
          </div>
        </div>

        <div className="mx-8 mt-8 p-6 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold text-amber-800 mb-4">
            Shipment Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Truck className="w-6 h-6 text-amber-600" />
              <p>
                <span className="font-medium">Product:</span>{" "}
                {draft.formData.ShipmentDetails["Product Description"]}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Plane className="w-6 h-6 text-amber-600" />
              <p>
                <span className="font-medium">Route:</span>{" "}
                {draft.formData.ShipmentDetails["Origin Country"]} to{" "}
                {draft.formData.ShipmentDetails["Destination Country"]}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-amber-600" />
              <p>
                <span className="font-medium">Compliance:</span>{" "}
                {draft.complianceData?.complianceStatus || "N/A"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <p>
                <span className="font-medium">Carbon Score:</span>{" "}
                {draft.routeData?.totalCarbonScore || "N/A"} kg CO2e
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Product Analysis
          </h2>

          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              Shipment Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Object.entries(draft.formData.ShipmentDetails).map(
                ([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-600">{key}</p>
                    <p className="text-gray-800">{value}</p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              Trade and Regulatory Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Object.entries(draft.formData.TradeAndRegulatoryDetails).map(
                ([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-600">{key}</p>
                    <p className="text-gray-800">
                      {typeof value === "object"
                        ? `${value.currency} ${value.amount}`
                        : value}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              Parties and Identifiers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Object.entries(draft.formData.PartiesAndIdentifiers).map(
                ([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-600">{key}</p>
                    <p className="text-gray-800">{value}</p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              Logistics and Handling
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Object.entries(draft.formData.LogisticsAndHandling).map(
                ([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-600">{key}</p>
                    <p className="text-gray-800">{value || "N/A"}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Page 2: Document Verification */}
        <div className="page-break p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Document Verification
          </h2>
          <div className="space-y-4">
            {Object.entries(draft.formData.DocumentVerification).map(
              ([doc, details]) => (
                <div
                  key={doc}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <p className="text-lg font-medium text-gray-700">
                    {doc}:{" "}
                    {details.checked ? (
                      <CheckCircle className="inline w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="inline w-5 h-5 text-red-500" />
                    )}
                  </p>
                  <div className="ml-4 mt-2">
                    {Object.entries(details.subItems).map(
                      ([subKey, subValue]) => (
                        <p key={subKey} className="text-sm text-gray-600">
                          - {subKey}: {subValue ? "Yes" : "No"}
                        </p>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Page 3: Compliance Response */}
        <div className="page-break p-8 bg-gray-50">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Compliance Response
          </h2>
          <ComplianceResponse response={draft.complianceData} />
        </div>

        {/* Page 4: Route Chosen and Route Map */}
        <div className="page-break p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Route Chosen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-gray-800">
                {draft.routeData?.totalCost || "N/A"} EUR
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Time</p>
              <p className="text-gray-800">
                {draft.routeData?.totalTime || "N/A"} hours
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Distance
              </p>
              <p className="text-gray-800">
                {draft.routeData?.totalDistance || "N/A"} km
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Carbon Score
              </p>
              <p className="text-gray-800">
                {draft.routeData?.totalCarbonScore || "N/A"} kg CO2e
              </p>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-600">Route Segments</p>
            <div className="space-y-2 mt-2">
              {draft.routeData?.routeDirections?.length > 0 ? (
                draft.routeData.routeDirections.map((segment) => (
                  <p
                    key={segment.id}
                    className="text-gray-800 flex items-center"
                  >
                    {segment.state === "land" ? (
                      <Truck className="w-5 h-5 mr-2" />
                    ) : segment.state === "sea" ? (
                      <Ship className="w-5 h-5 mr-2" />
                    ) : (
                      <Plane className="w-5 h-5 mr-2" />
                    )}
                    {segment.waypoints[0]} to {segment.waypoints[1]} (
                    {segment.state})
                  </p>
                ))
              ) : (
                <p className="text-gray-800">N/A</p>
              )}
            </div>
          </div>

          <div className="mt-8 bg-gray-50 p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Route Map
            </h2>
            <MapView draftId={draftId} />
          </div>
        </div>

        {/* Page 5: Carbon Footprint Summary, Emissions Breakdown, Route Analysis, Suggestions, Environmental Impact, and Footer */}
        <div className="page-break p-8">
          {carbonLoading ? (
            <div className="flex items-center justify-center mt-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-600 font-medium">
                Loading carbon data...
              </p>
            </div>
          ) : carbonData ? (
            <>
              <div style={{ minHeight: "150px" }}>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Carbon Footprint Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Total Distance</p>
                    <p className="text-lg font-bold">
                      {carbonData.totalDistance}
                    </p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">Total Emissions</p>
                    <p className="text-lg font-bold text-red-600">
                      {carbonData.totalEmissions}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ minHeight: "300px" }} className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Emissions Breakdown
                </h3>
                {chartData && (
                  <div style={{ height: "250px", width: "100%" }}>
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                )}
              </div>

              <div style={{ minHeight: "200px" }} className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Route Analysis
                </h3>
                <div className="space-y-4">
                  {carbonData.routeAnalysis.map((leg, idx) => (
                    <div key={idx} className="bg-gray-100 p-4 rounded-lg">
                      <p className="text-lg font-semibold text-teal-600">
                        {leg.leg}: {leg.origin} → {leg.destination}
                      </p>
                      <p className="text-gray-800">
                        <span className="font-medium">Mode:</span>{" "}
                        {leg.mode === "land" ? (
                          <Truck className="inline w-5 h-5 mr-1" />
                        ) : leg.mode === "sea" ? (
                          <Ship className="inline w-5 h-5 mr-1" />
                        ) : (
                          <Plane className="inline w-5 h-5 mr-1" />
                        )}
                        {leg.mode}
                      </p>
                      <p className="text-gray-800">
                        <span className="font-medium">Distance:</span>{" "}
                        {leg.distance}
                      </p>
                      <p className="text-gray-800">
                        <span className="font-medium">Emissions:</span>{" "}
                        <span className="text-red-600">{leg.emissions}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ minHeight: "150px" }} className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Suggestions
                </h3>
                <ul className="bg-gray-100 p-4 rounded-lg space-y-2">
                  {carbonData.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ minHeight: "100px" }} className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Environmental Impact
                </h3>
                <div className="bg-gray-100 p-6 rounded-lg text-center">
                  <p className="text-gray-800">{carbonData.earthImpact}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-600 mt-8">
              Carbon footprint data is not available for this draft.
            </p>
          )}
        </div>
        <footer>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white text-center mt-8">
            <p className="text-sm">
              Report generated by SmartLogix. Cargo is ready for shipment.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ExportReport;
