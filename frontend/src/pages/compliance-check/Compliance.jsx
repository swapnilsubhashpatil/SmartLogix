import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import { Home } from "@mui/icons-material";
import HomeIcon from "@mui/icons-material/Home";
import Header from "../../components/Header";
const ComplianceOverview = () => {
  const navigate = useNavigate();
  const toHome = () => {
    navigate("/dashboard");
  };

  const features = [
    {
      title: "CSV Upload",
      description:
        "Upload a CSV file with shipment details using a provided sample CSV template with specific headers. The system automatically populates the compliance form with the uploaded data, allowing users to quickly complete compliance checks. Users can reuse the same format with updated values for multiple uploads, streamlining the process for faster form completion.",
      useCases: [
        "Rapidly fill compliance forms for multiple shipments using a standardized CSV template.",
        "Reduce manual data entry errors with automated form population.",
        "Efficiently handle recurring compliance checks with consistent CSV formatting.",
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
        "Leverage AI to analyze products, from simple to complex, and generate precise HS codes, detailed descriptions, and classifications for perishable or hazardous status. This feature creates a new record with the analyzed data, enabling users to seamlessly proceed with compliance checks using the generated information.",
      useCases: [
        "Obtain accurate HS codes and classifications for any product type.",
        "Automatically generate compliance-ready product records for streamlined processing.",
        "Ensure regulatory adherence by identifying perishable or hazardous materials.",
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
      title: "Manual Compliance Check",
      description:
        "Complete a compliance check by manually filling out a structured form with multiple inputs, including mandatory and optional fields. Each input is accompanied by an info button providing guidance on the required information, ensuring accurate and informed data entry for thorough compliance verification.",
      useCases: [
        "Perform detailed compliance checks for individual shipments with guided input fields.",
        "Access clear instructions via info buttons to accurately complete the form.",
        "Handle both mandatory and optional fields for flexible compliance requirements.",
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
      <Header title="Compliance Check" page="compliance-check" />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Introduction Section */}
        <div className="text-center mb-12">
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

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div
                className={`bg-gradient-to-r ${feature.bgGradient} p-6 text-center`}
              >
                <div
                  className={`w-16 h-16 mx-auto bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <button
                  onClick={() => navigate(feature.action.path)}
                  className={`w-full px-6 py-3 bg-gradient-to-r ${feature.gradient} text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50`}
                >
                  {feature.action.label}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Feature Information - Horizontal Cards */}
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Detailed Feature Information
            </h3>
            <p className="text-lg text-gray-600">
              Learn more about each compliance method and their use cases
            </p>
          </div>

          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Left Side - Icon and Title */}
                <div
                  className={`bg-gradient-to-br ${feature.bgGradient} p-8 lg:w-1/3 flex flex-col justify-center`}
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Right Side - Use Cases */}
                <div className="p-8 lg:w-2/3 flex flex-col justify-center">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {feature.useCases.map((useCase, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl group/item hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="w-2 h-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mt-3 group-hover/item:scale-150 transition-transform duration-200"></div>
                        <p className="text-gray-700 text-sm leading-relaxed group-hover/item:text-gray-900 transition-colors duration-200">
                          {useCase}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceOverview;
