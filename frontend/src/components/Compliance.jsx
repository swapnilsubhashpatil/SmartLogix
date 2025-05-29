import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import { Home } from "@mui/icons-material";
import HomeIcon from "@mui/icons-material/Home";

const ComplianceOverview = () => {
  const navigate = useNavigate();
  const toHome = () => {
    navigate("/dashboard");
  };
  const features = [
    {
      title: "Compliance Check (Comma-Spaced Analysis)",
      description:
        "Upload a CSV file containing shipment details to perform a compliance check. The system analyzes comma-separated data to identify regulatory issues, such as missing HS codes, invalid country pairs, or incomplete documentation.",
      useCases: [
        "Bulk processing of shipment data for compliance verification.",
        "Automating checks for large datasets from ERP systems.",
        "Ensuring customs compliance before submitting to authorities.",
      ],
      action: {
        label: "Upload CSV",
        path: "/csv-upload",
      },
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      title: "Product Analysis",
      description:
        "Analyze product details to ensure compliance with trade regulations, environmental standards, and safety requirements. This feature provides insights into product classifications and restrictions.",
      useCases: [
        "Verifying HS codes for accurate tariff classification.",
        "Checking for restricted or dual-use goods.",
        "Ensuring products meet destination country standards.",
      ],
      action: {
        label: "Go to Product Analysis",
        path: "/product-analysis",
      },
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      title: "Compliance Check (Form-Based)",
      description:
        "Manually enter shipment details through a structured form to perform a detailed compliance check. This feature is ideal for single shipments or when CSV data is unavailable.",
      useCases: [
        "Ad-hoc compliance checks for small shipments.",
        "Detailed verification of complex trade agreements.",
        "Manual entry for shipments with unique requirements.",
      ],
      action: {
        label: "Start Compliance Check",
        path: "/compliance-check",
      },
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6">
      {/* Header - Unchanged */}
      <header className="relative bg-gradient-to-r from-teal-200 to-blue-400 text-white py-6 sm:py-8 rounded-b-3xl overflow-hidden">
        <div className="absolute inset-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 100C240 30 480 170 720 100C960 30 1200 170 1440 100V200H0V100Z"
              fill="white"
              fillOpacity="0.1"
            />
            <path
              d="M0 150C240 80 480 220 720 150C960 80 1200 220 1440 150V200H0V150Z"
              fill="white"
              fillOpacity="0.2"
            />
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#f4ce14] rounded-full flex items-center justify-center">
              <Home onClick={toHome} />
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Compliance Check
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Introduction Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Choose Your Compliance Method
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Select the most suitable approach for your compliance needs. Each
            method is designed to streamline your workflow and ensure regulatory
            adherence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <defs>
                    <pattern
                      id={`grid-${index}`}
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 10 0 L 0 0 0 10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill={`url(#grid-${index})`} />
                </svg>
              </div>

              {/* Card Header */}
              <div
                className={`bg-gradient-to-r ${feature.bgGradient} p-8 relative`}
              >
                <div className="flex items-start space-x-6">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8">
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">
                      Key Use Cases
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {feature.useCases.map((useCase, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-4 group/item"
                      >
                        <div className="w-2 h-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mt-3 group-hover/item:scale-150 transition-transform duration-200"></div>
                        <p className="text-gray-700 leading-relaxed group-hover/item:text-gray-900 transition-colors duration-200">
                          {useCase}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-start">
                  <button
                    onClick={() => navigate(feature.action.path)}
                    className={`group/btn relative px-8 py-4 bg-gradient-to-r ${feature.gradient} text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50`}
                    style={{
                      focusRingColor: feature.gradient.includes("blue")
                        ? "#3B82F6"
                        : feature.gradient.includes("purple")
                        ? "#8B5CF6"
                        : "#10B981",
                    }}
                  >
                    <span className="relative flex items-center justify-center space-x-3">
                      <span>{feature.action.label}</span>
                      <svg
                        className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceOverview;
