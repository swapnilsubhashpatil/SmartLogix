import React from "react";
import { CheckCircle, Warning } from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ComplianceResponse Component
const ComplianceResponse = ({ response }) => {
  if (!response) return null;

  const {
    complianceStatus,
    riskLevel,
    summary,
    violations = [], // Default to empty array if undefined
    recommendations = [], // Default to empty array if undefined
    scores,
    additionalTips = [], // Default to empty array if undefined
  } = response;

  // Prepare data for the bar chart with correct key mapping
  const chartData = [
    { name: "Shipment Details", score: scores?.ShipmentDetails || 0 },
    {
      name: "Trade & Regulatory",
      score: scores?.TradeAndRegulatoryDetails || 0,
    },
    {
      name: "Parties & Identifiers",
      score: scores?.PartiesAndIdentifiers || 0,
    },
    { name: "Logistics & Handling", score: scores?.LogisticsAndHandling || 0 },
    { name: "Intended Use", score: scores?.IntendedUseDetails || 0 },
  ];

  return (
    <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-custom-medium rounded-lg p-8 animate__animated animate__fadeIn">
      {/* Header */}
      <h2 className="text-3xl font-bold text-indigo-700 mb-6 flex items-center">
        <span className="mr-2">
          {complianceStatus === "Ready for Shipment" ? (
            <CheckCircle className="text-green-500" fontSize="large" />
          ) : (
            <Warning className="text-red-500" fontSize="large" />
          )}
        </span>
        Compliance Check Results
      </h2>

      {/* Compliance Status */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Status</h3>
        <span
          className={`inline-block px-4 py-2 mt-2 rounded-full text-white font-medium ${
            complianceStatus === "Ready for Shipment"
              ? "bg-green-500"
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
          <p className="text-gray-600">Risk Score: {riskLevel.riskScore}/100</p>
          <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
            <div
              className={`h-4 rounded-full ${
                riskLevel.riskScore < 30
                  ? "bg-green-500"
                  : riskLevel.riskScore < 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${riskLevel.riskScore}%` }}
            ></div>
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
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full bg-white rounded-lg shadow-sm">
              <thead>
                <tr className="bg-indigo-100">
                  <th className="px-4 py-2 text-left text-indigo-700">Field</th>
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
                        {violation.field}
                      </td>
                      <td className="px-4 py-2 text-red-600">
                        {violation.message}
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
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#4F46E5" />
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
  );
};

export default ComplianceResponse;
