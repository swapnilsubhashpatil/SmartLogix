import React from "react";
import Login from "./components/Login";
import CreateAccount from "./components/CreateAccount";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ComplianceCheck from "./components/ComplianceCheck";
import Profile from "./components/Profile";
import RouteOptimization from "./components/RouteOptimization";
import RouteMap from "./components/route";
import CarbonFootprint from "./components/CarbonFootprint";
import { LoadScript } from "@react-google-maps/api";
import ProductAnalysis from "./components/ProductAnalysis";
import InventoryManagement from "./components/InventoryManagement";
import ExportReport from "./components/ExportReport";
import Compliance from "./components/Compliance";
import CsvUpload from "./components/CsvUpload";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/createAccount" element={<CreateAccount />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compliance-check"
          element={
            <ProtectedRoute>
              <ComplianceCheck />
            </ProtectedRoute>
          }
        />
        <Route
          path="/route-optimization"
          element={
            <ProtectedRoute>
              <RouteOptimization />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <RouteMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/carbon-footprint"
          element={
            <ProtectedRoute>
              <CarbonFootprint />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product-analysis"
          element={
            <ProtectedRoute>
              <ProductAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory-management"
          element={
            <ProtectedRoute>
              <InventoryManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compliance"
          element={
            <ProtectedRoute>
              <Compliance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/csv-upload"
          element={
            <ProtectedRoute>
              <CsvUpload />
            </ProtectedRoute>
          }
        />
        <Route path="/export-report/:draftId" element={<ExportReport />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
