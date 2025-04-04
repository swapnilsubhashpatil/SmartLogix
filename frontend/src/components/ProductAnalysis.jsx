import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Home, ContentCopy, Send } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import { FaTrash, FaImage } from "react-icons/fa";
import ProductAnalysisSkeleton from "./Skeleton/ProductAnalysisSkeleton";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ProductAnalysis = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      setAnalysisResult(null); // Reset previous results when a new image is added
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setAnalysisResult(null);
    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.post(
        `${BACKEND_URL}/api/analyze-product`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAnalysisResult(response.data);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAnalysisResult({ error: error.message || "Failed to analyze image" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  const handleSendToCompliance = () => {
    if (!analysisResult || !analysisResult.data) return;

    const complianceData = {
      "HS Code": analysisResult.data["HS Code"],
      "Product Description": analysisResult.data["Product Description"],
      Perishable: analysisResult.data["Perishable"],
      Hazardous: analysisResult.data["Hazardous"],
    };

    localStorage.setItem("productAnalysisData", JSON.stringify(complianceData));
    navigate("/compliance-check");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6">
      <header className="relative bg-gradient-to-r from-teal-200 to-blue-400 text-white py-6 sm:py-8 rounded-b-3xl overflow-hidden">
        {/* Wavy Background Shape */}
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

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#f4ce14] rounded-full flex items-center justify-center">
              <Home onClick={() => navigate("/dashboard")} />
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Product Analysis
            </h1>
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto mt-6"
      >
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
          {/* Drag-and-Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
              isDragging
                ? "border-teal-500 bg-teal-50"
                : "border-gray-300 bg-gray-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedImage ? (
              <div>
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Preview"
                  className="mt-4 mx-auto max-w-xs rounded-lg shadow-md"
                />
                <p className="text-gray-600 mt-4">
                  Selected:{" "}
                  <span className="font-semibold">{selectedImage.name}</span>
                </p>
                <button
                  onClick={handleRemoveImage}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center mx-auto"
                >
                  <FaTrash className="mr-2" />
                  Remove Image
                </button>
              </div>
            ) : (
              <>
                <FaImage className="text-teal-500 text-3xl mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {isDragging
                    ? "Drop your image here"
                    : "Drag and drop an image here, or click to select"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                >
                  Select Image
                </button>
              </>
            )}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!selectedImage || isLoading}
            className={`w-full sm:w-auto py-2 px-6 text-lg font-medium rounded-lg transition-colors ${
              !selectedImage || isLoading
                ? "bg-gray-400 cursor-not-allowed text-gray-700"
                : "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
            }`}
          >
            {isLoading ? "Analyzing..." : "Analyze Product"}
          </button>

          {/* Analysis Result */}
          {isLoading && <ProductAnalysisSkeleton />}
          {analysisResult && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mt-8"
            >
              {analysisResult.data ? (
                <>
                  <motion.h2
                    variants={itemVariants}
                    className="text-2xl font-bold text-teal-600 mb-6"
                  >
                    Analysis Results
                  </motion.h2>

                  {/* Product Details */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Product Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600 font-medium">
                          HS Code:
                        </span>
                        <span className="flex-1 text-gray-800">
                          {analysisResult.data["HS Code"]}
                        </span>
                        <Tooltip title="Copy HS Code" placement="top">
                          <button
                            onClick={() =>
                              handleCopy(analysisResult.data["HS Code"])
                            }
                            className="ml-2 p-2 text-gray-500 hover:text-teal-600 transition"
                          >
                            <ContentCopy fontSize="small" />
                          </button>
                        </Tooltip>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600 font-medium">
                          Description:
                        </span>
                        <span className="flex-1 text-gray-800">
                          {analysisResult.data["Product Description"]}
                        </span>
                        <Tooltip title="Copy Description" placement="top">
                          <button
                            onClick={() =>
                              handleCopy(
                                analysisResult.data["Product Description"]
                              )
                            }
                            className="ml-2 p-2 text-gray-500 hover:text-teal-600 transition"
                          >
                            <ContentCopy fontSize="small" />
                          </button>
                        </Tooltip>
                      </div>
                      <div>
                        <span className="w-32 text-gray-600 font-medium">
                          Perishable:
                        </span>
                        <span className="text-gray-800">
                          {analysisResult.data["Perishable"] ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="w-32 text-gray-600 font-medium">
                          Hazardous:
                        </span>
                        <span className="text-gray-800">
                          {analysisResult.data["Hazardous"] ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Required Export Documents */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Required Export Documents
                    </h3>
                    <ul className="list-disc ml-6 text-gray-800 space-y-2">
                      {analysisResult.data["Required Export Document List"].map(
                        (doc, index) => (
                          <li key={index}>{doc}</li>
                        )
                      )}
                    </ul>
                  </motion.div>

                  {/* Recommendations */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-r from-teal-50 to-yellow-50 rounded-xl p-6 border border-teal-200 mb-6"
                  >
                    <h3 className="text-xl font-semibold text-teal-600 mb-4">
                      Recommendations
                    </h3>
                    <p className="text-gray-800 mb-2">
                      <strong>Message:</strong>{" "}
                      {analysisResult.data.Recommendations.message}
                    </p>
                    <p className="text-gray-800">
                      <strong>Additional Tips:</strong>{" "}
                      {analysisResult.data.Recommendations.additionalTip}
                    </p>
                  </motion.div>

                  {/* Send to Compliance Check */}
                  <motion.div variants={itemVariants}>
                    <button
                      onClick={handleSendToCompliance}
                      className="w-full sm:w-auto py-2 px-6 text-lg font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition flex items-center justify-center"
                    >
                      <Send className="mr-2" />
                      Send to Compliance Check
                    </button>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="text-red-500 text-center"
                >
                  Error: {analysisResult.error}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProductAnalysis;
