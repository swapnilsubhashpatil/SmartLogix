import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Home,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Truck,
  Ship,
  Plane,
  MoreHorizontal,
} from "lucide-react";
import { Warning } from "@mui/icons-material";
import HomeIcon from "@mui/icons-material/Home";
import Header from "../../components/Header";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import MapView from "./MapView";

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
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 shadow-lg">
        <div>
          {/* Header */}
          <h2 className="text-3xl font-bold text-indigo-800 mb-6 flex items-center">
            <span className="mr-2">
              {complianceStatus === "Ready for Shipment" ? (
                <CheckCircle
                  className="text-green-600"
                  style={{ width: "2rem", height: "2rem" }}
                />
              ) : (
                <Warning
                  className="text-red-600"
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
              className={`inline-block px-4 py-2 mt-2 rounded-full text-white font-medium shadow-sm ${
                riskLevel.riskScore < 30
                  ? "bg-green-600"
                  : riskLevel.riskScore < 60
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
            >
              {complianceStatus}
            </span>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Summary</h3>
            <p className="mt-2 text-gray-600 leading-relaxed">{summary}</p>
          </div>

          {/* Risk Level */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Risk Level</h3>
            <div className="mt-2">
              <p className="text-gray-600">
                Risk Score: {riskLevel.riskScore}/100
              </p>
              <div className="w-full bg-gray-200 rounded-full h-4 mt-2 shadow-inner">
                <div
                  style={{ width: `${riskLevel.riskScore}%` }}
                  className={`h-4 rounded-full transition-all duration-300 ${
                    riskLevel.riskScore < 30
                      ? "bg-green-600"
                      : riskLevel.riskScore < 60
                      ? "bg-yellow-600"
                      : "bg-red-600"
                  }`}
                />
              </div>
              <p className="mt-2 text-gray-600 leading-relaxed">
                {riskLevel.summary}
              </p>
            </div>
          </div>

          {/* Violations and Recommendations */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Issues & Recommendations
            </h3>
            <div className="mt-2">
              {violations.length === 0 ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>No violations</span>
                </div>
              ) : (
                <table className="min-w-full bg-white rounded-lg shadow-sm">
                  <thead>
                    <tr className="bg-indigo-100">
                      <th className="px-4 py-2 text-left text-indigo-800 font-semibold">
                        Field
                      </th>
                      <th className="px-4 py-2 text-left text-indigo-800 font-semibold">
                        Violation
                      </th>
                      <th className="px-4 py-2 text-left text-indigo-800 font-semibold">
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
                        <tr key={index} className="border-b hover:bg-gray-50">
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
              )}
            </div>
          </div>

          {/* Scores */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Compliance Scores
            </h3>
            <div className="mt-4">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between py-2 px-3 bg-gray-50 rounded-md mb-1"
                >
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-indigo-600 font-medium">
                    {item.score}/100
                  </span>
                </div>
              ))}
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
                    <span className="text-indigo-600 mr-2">•</span>
                    <span className="text-gray-600 leading-relaxed">{tip}</span>
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

// PDF Document Component using @react-pdf/renderer
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#1E3A8A",
    color: "#FFFFFF",
    padding: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1F2937",
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    color: "#4B5563",
    lineHeight: 1.5,
  },
  subSection: {
    marginLeft: 10,
    marginBottom: 10,
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 10,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
  },
  tableHeader: {
    backgroundColor: "#E0E7FF",
    padding: 5,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  tableCell: {
    padding: 5,
    width: "33.33%",
    fontSize: 11,
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    color: "#FFFFFF",
    backgroundColor: "#1E3A8A",
    padding: 10,
    borderRadius: 8,
  },
});

const PDFDocument = ({ draft, user, generationDate, carbonData }) => (
  <Document>
    {/* Single Page with All Sections */}
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Export Report</Text>
        <Text style={styles.subtitle}>Prepared for: {user || "User"}</Text>
        <Text style={styles.subtitle}>Generated on: {generationDate}</Text>
      </View>

      {/* Shipment Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipment Summary</Text>
        <Text style={styles.text}>
          Product: {draft.formData.ShipmentDetails["Product Description"]}
        </Text>
        <Text style={styles.text}>
          Route: {draft.formData.ShipmentDetails["Origin Country"]} to{" "}
          {draft.formData.ShipmentDetails["Destination Country"]}
        </Text>
        <Text style={styles.text}>
          Compliance: {draft.complianceData?.complianceStatus || "N/A"}
        </Text>
        <Text style={styles.text}>
          Carbon Score: {draft.routeData?.totalCarbonScore || "N/A"} kg CO2e
        </Text>
      </View>

      {/* Product Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Analysis</Text>
        <View style={styles.subSection}>
          <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
            Shipment Details
          </Text>
          {Object.entries(draft.formData.ShipmentDetails).map(
            ([key, value]) => (
              <Text key={key} style={styles.text}>
                {key}: {value}
              </Text>
            )
          )}
        </View>
        <View style={styles.subSection}>
          <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
            Trade and Regulatory Details
          </Text>
          {Object.entries(draft.formData.TradeAndRegulatoryDetails).map(
            ([key, value]) => (
              <Text key={key} style={styles.text}>
                {key}:{" "}
                {typeof value === "object"
                  ? `${value.currency} ${value.amount}`
                  : value}
              </Text>
            )
          )}
        </View>
        <View style={styles.subSection}>
          <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
            Parties and Identifiers
          </Text>
          {Object.entries(draft.formData.PartiesAndIdentifiers).map(
            ([key, value]) => (
              <Text key={key} style={styles.text}>
                {key}: {value}
              </Text>
            )
          )}
        </View>
        <View style={styles.subSection}>
          <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
            Logistics and Handling
          </Text>
          {Object.entries(draft.formData.LogisticsAndHandling).map(
            ([key, value]) => (
              <Text key={key} style={styles.text}>
                {key}: {value || "N/A"}
              </Text>
            )
          )}
        </View>
      </View>

      {/* Document Verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Document Verification</Text>
        {Object.entries(draft.formData.DocumentVerification).map(
          ([doc, details]) => (
            <View key={doc} style={{ marginBottom: 10 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "bold", color: "#374151" }}
              >
                {doc}: {details.checked ? "✓" : "✗"}
              </Text>
              <View style={styles.subSection}>
                {Object.entries(details.subItems).map(([subKey, subValue]) => (
                  <Text key={subKey} style={styles.text}>
                    - {subKey}: {subValue ? "Yes" : "No"}
                  </Text>
                ))}
              </View>
            </View>
          )
        )}
      </View>

      {/* Compliance Response */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Response</Text>
        {draft.complianceData &&
        Object.keys(draft.complianceData).length > 0 ? (
          <>
            <Text style={styles.text}>
              Status: {draft.complianceData.complianceStatus ?? "Not Ready"}
            </Text>
            <Text style={styles.text}>
              Summary: {draft.complianceData.summary ?? "No summary provided"}
            </Text>
            <Text style={styles.text}>
              Risk Score: {draft.complianceData.riskLevel?.riskScore ?? 0}/100
            </Text>
            <Text style={styles.text}>
              Risk Summary:{" "}
              {draft.complianceData.riskLevel?.summary ??
                "No risk assessment available"}
            </Text>
            <View style={styles.section}>
              <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
                Issues & Recommendations
              </Text>
              {draft.complianceData.violations?.length === 0 ? (
                <Text style={{ ...styles.text, color: "#16A34A" }}>
                  ✓ No violations
                </Text>
              ) : (
                <View style={styles.table}>
                  <View style={styles.tableRow}>
                    <Text
                      style={{ ...styles.tableHeader, ...styles.tableCell }}
                    >
                      Field
                    </Text>
                    <Text
                      style={{ ...styles.tableHeader, ...styles.tableCell }}
                    >
                      Violation
                    </Text>
                    <Text
                      style={{ ...styles.tableHeader, ...styles.tableCell }}
                    >
                      Recommendation
                    </Text>
                  </View>
                  {draft.complianceData.violations.map((violation, index) => {
                    const matchingRecommendation =
                      draft.complianceData.recommendations.find(
                        (rec) => rec.field === violation.field
                      );
                    return (
                      <View key={index} style={styles.tableRow}>
                        <Text style={styles.tableCell}>
                          {violation.field || "Unknown"}
                        </Text>
                        <Text style={{ ...styles.tableCell, color: "#DC2626" }}>
                          {violation.message || "No message"}
                        </Text>
                        <Text style={{ ...styles.tableCell, color: "#16A34A" }}>
                          {matchingRecommendation?.message || "N/A"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
            <View style={styles.section}>
              <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
                Compliance Scores
              </Text>
              {Object.entries(draft.complianceData.scores || {}).map(
                ([key, value]) => (
                  <Text key={key} style={styles.text}>
                    {key}: {value}/100
                  </Text>
                )
              )}
            </View>
            {draft.complianceData.additionalTips?.length > 0 && (
              <View style={styles.section}>
                <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
                  Additional Tips
                </Text>
                {draft.complianceData.additionalTips.map((tip, index) => (
                  <Text key={index} style={styles.text}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.text}>No compliance results available.</Text>
        )}
      </View>

      {/* Route Chosen (Without Map) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Chosen</Text>
        <Text style={styles.text}>
          Total Cost: {draft.routeData?.totalCost || "N/A"} EUR
        </Text>
        <Text style={styles.text}>
          Total Time: {draft.routeData?.totalTime || "N/A"} hours
        </Text>
        <Text style={styles.text}>
          Total Distance: {draft.routeData?.totalDistance || "N/A"} km
        </Text>
        <Text style={styles.text}>
          Total Carbon Score: {draft.routeData?.totalCarbonScore || "N/A"} kg
          CO2e
        </Text>
        <View style={styles.subSection}>
          <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
            Route Segments
          </Text>
          {draft.routeData?.routeDirections?.length > 0 ? (
            draft.routeData.routeDirections.map((segment) => (
              <Text key={segment.id} style={styles.text}>
                {segment.waypoints[0]} to {segment.waypoints[1]} (
                {segment.state})
              </Text>
            ))
          ) : (
            <Text style={styles.text}>N/A</Text>
          )}
        </View>
      </View>

      {/* Carbon Footprint Summary (Without Graph) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carbon Footprint Summary</Text>
        {carbonData ? (
          <>
            <Text style={styles.text}>
              Total Distance: {carbonData.totalDistance}
            </Text>
            <Text style={styles.text}>
              Total Emissions: {carbonData.totalEmissions}
            </Text>
            <View style={styles.subSection}>
              <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
                Route Analysis
              </Text>
              {carbonData.routeAnalysis.map((leg, idx) => (
                <View key={idx} style={{ marginBottom: 5 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: "#0D9488",
                    }}
                  >
                    {leg.leg}: {leg.origin} → {leg.destination}
                  </Text>
                  <Text style={styles.text}>Mode: {leg.mode}</Text>
                  <Text style={styles.text}>Distance: {leg.distance}</Text>
                  <Text style={styles.text}>Emissions: {leg.emissions}</Text>
                </View>
              ))}
            </View>
            <View style={styles.subSection}>
              <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
                Suggestions
              </Text>
              {carbonData.suggestions.map((suggestion, idx) => (
                <Text key={idx} style={styles.text}>
                  • {suggestion}
                </Text>
              ))}
            </View>
            <View style={styles.subSection}>
              <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
                Environmental Impact
              </Text>
              <Text style={styles.text}>{carbonData.earthImpact}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.text}>
            Carbon footprint data is not available for this draft.
          </Text>
        )}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Report generated by SmartLogix. Cargo is ready for shipment.
      </Text>
    </Page>
  </Document>
);

// Main ExportReport Component
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function ExportReport() {
  const { draftId } = useParams();
  const [user, setUser] = useState(null); // Initialize as null
  const [draft, setDraft] = useState(null);
  const [carbonData, setCarbonData] = useState(null);
  const [loading, setLoading] = useState(true); // Consolidated loading state
  const [error, setError] = useState(null);
  const [carbonLoading, setCarbonLoading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const navigate = useNavigate();

  const toHome = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        // Fetch user
        const userResponse = await axios.get(`${BACKEND_URL}/protectedRoute`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(
          userResponse.data.user.firstName +
            " " +
            userResponse.data.user.lastName
        );

        // Fetch draft
        if (!draftId) throw new Error("No draft ID provided in URL");
        const draftResponse = await axios.get(
          `${BACKEND_URL}/api/drafts/${draftId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDraft(draftResponse.data.draft);
      } catch (err) {
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [draftId]);

  useEffect(() => {
    const fetchAndGenerateCarbonData = async () => {
      if (!draft) return;
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
          // Continue to generate carbon data if GET fails
        }

        const carbonParams = {
          draftId: draftId,
          origin: draft.routeData.routeDirections[0].waypoints[0],
          destination:
            draft.routeData.routeDirections[
              draft.routeData.routeDirections.length - 1
            ].waypoints[1],
          distance: draft.routeData.totalDistance,
          weight: parseFloat(draft.formData.ShipmentDetails["Gross Weight"]),
          routeDirections: draft.routeData.routeDirections,
          distanceByLeg: draft.routeData.distanceByLeg,
        };

        const carbonResponse = await axios.post(
          `${BACKEND_URL}/api/carbon-footprint`,
          carbonParams,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex flex-col">
        <Header title="Export Report" page="export" />
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-700 font-semibold tracking-wide animate-pulse">
              Generating your report...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex flex-col">
        <Header title="Export Report" page="export" />
        <div className="text-center bg-white p-6 rounded-2xl shadow-xl">
          <p className="text-red-600 mb-4 font-medium">{error}</p>
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

  // Validate draft data
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
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex flex-col">
        <Header title="Export Report" page="export" />
        <div className="text-center bg-white p-6 rounded-2xl shadow-xl">
          <p className="text-red-600 mb-4 font-medium">
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex flex-col">
      <Header title="Export Report" page="export" />

      {/* Loading Screen */}
      {loading ? (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-700 font-semibold tracking-wide animate-pulse">
              Generating your report...
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto my-8 bg-white shadow-xl rounded-2xl overflow-hidden flex-grow">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 sm:p-8 text-white relative">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Export Report
            </h1>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <p className="text-base sm:text-lg">
                Prepared for:{" "}
                <span className="font-semibold">{user || "User"}</span>
              </p>
              <p className="text-base sm:text-lg">
                Generated on:{" "}
                <span className="font-semibold">{generationDate}</span>
              </p>
            </div>
            {/* Three Horizontal Dots for Download Menu */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
                  <PDFDownloadLink
                    document={
                      <PDFDocument
                        draft={draft}
                        user={user}
                        generationDate={generationDate}
                        carbonData={carbonData}
                      />
                    }
                    fileName={`ExportReport-${draftId}.pdf`}
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-lg"
                  >
                    {({ loading }) =>
                      loading ? "Generating PDF..." : "Download PDF"
                    }
                  </PDFDownloadLink>
                </div>
              )}
            </div>
          </div>

          {/* Shipment Summary */}
          <div className="mx-4 sm:mx-8 mt-6 p-6 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
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

          {/* Product Analysis */}
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Product Analysis
            </h2>

            <div className="mb-6">
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Shipment Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

          {/* Document Verification */}
          <div className="p-6 sm:p-8 bg-gray-50">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Document Verification
            </h2>
            <div className="space-y-4">
              {Object.entries(draft.formData.DocumentVerification).map(
                ([doc, details]) => (
                  <div
                    key={doc}
                    className="border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <p className="text-lg font-medium text-gray-700">
                      {doc}:{" "}
                      {details.checked ? (
                        <CheckCircle className="inline w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="inline w-5 h-5 text-red-600" />
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

          {/* Compliance Response */}
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Compliance Response
            </h2>
            <ComplianceResponse response={draft.complianceData} />
          </div>

          {/* Route Chosen */}
          <div className="p-6 sm:p-8 bg-gray-50">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Route Chosen
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
              <p className="text-sm font-medium text-gray-600">
                Route Segments
              </p>
              <div className="space-y-2 mt-2">
                {draft.routeData?.routeDirections?.length > 0 ? (
                  draft.routeData.routeDirections.map((segment) => (
                    <p
                      key={segment.id}
                      className="text-gray-800 flex items-center"
                    >
                      {segment.state === "land" ? (
                        <Truck className="w-5 h-5 mr-2 text-indigo-600" />
                      ) : segment.state === "sea" ? (
                        <Ship className="w-5 h-5 mr-2 text-indigo-600" />
                      ) : (
                        <Plane className="w-5 h-5 mr-2 text-indigo-600" />
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
          </div>

          <div className="mt-8 bg-gray-50 p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Route Map
            </h2>
            <MapView draftId={draftId} />
          </div>

          {/* Carbon Footprint Summary (Without Graph) */}
          <div className="p-6 sm:p-8">
            {carbonLoading ? (
              <div className="flex items-center justify-center mt-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="ml-3 text-gray-600 font-medium">
                  Loading carbon data...
                </p>
              </div>
            ) : carbonData ? (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Carbon Footprint Summary
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                      <p className="text-gray-600 text-sm">Total Distance</p>
                      <p className="text-lg font-bold">
                        {carbonData.totalDistance}
                      </p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                      <p className="text-gray-600 text-sm">Total Emissions</p>
                      <p className="text-lg font-bold text-red-600">
                        {carbonData.totalEmissions}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Route Analysis
                  </h3>
                  <div className="space-y-4">
                    {carbonData.routeAnalysis.map((leg, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-100 p-4 rounded-lg shadow-sm"
                      >
                        <p className="text-lg font-semibold text-teal-600">
                          {leg.leg}: {leg.origin} → {leg.destination}
                        </p>
                        <p className="text-gray-800">
                          <span className="font-medium">Mode:</span>{" "}
                          {leg.mode === "land" ? (
                            <Truck className="inline w-5 h-5 mr-1 text-indigo-600" />
                          ) : leg.mode === "sea" ? (
                            <Ship className="inline w-5 h-5 mr-1 text-indigo-600" />
                          ) : (
                            <Plane className="inline w-5 h-5 mr-1 text-indigo-600" />
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

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Suggestions
                  </h3>
                  <ul className="bg-gray-100 p-4 rounded-lg space-y-2 shadow-sm">
                    {carbonData.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Environmental Impact
                  </h3>
                  <div className="bg-gray-100 p-6 rounded-lg text-center shadow-sm">
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

          {/* Footer */}
          <footer>
            <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-4 text-white text-center">
              <p className="text-sm">
                Report generated by SmartLogix. Cargo is ready for shipment.
              </p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

export default ExportReport;
