import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import CreateAccount from "./components/CreateAccount";
import Dashboard from "./components/Dashboard";
import ComplianceCheck from "./components/ComplianceCheck";
import Profile from "./components/Profile";
import History from "./components/History";
import ManageAccount from "./components/ManageAccount";
import Analysis from "./components/Analysis";
import RouteOptimization from "./components/RouteOptimization";
import RouteMap from "./components/route";
import CarbonFootprint from "./components/CarbonFootprint";
import ProductAnalysis from "./components/ProductAnalysis";
import InventoryManagement from "./components/InventoryManagement";
import ExportReport from "./components/ExportReport";
import Compliance from "./components/Compliance";
import CsvUpload from "./components/CsvUpload";
import News from "./components/News";
import ProtectedRoute from "./components/ProtectedRoute"; // Should return <Outlet /> if authenticated

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/createAccount" element={<CreateAccount />} />

        {/* Protected Routes (Wrap in ProtectedRoute layout) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/compliance-check" element={<ComplianceCheck />} />
          <Route path="/route-optimization" element={<RouteOptimization />} />
          <Route path="/map/:draftId" element={<RouteMap />} />
          <Route path="/map" element={<RouteMap />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/history/:userId" element={<History />} />
          <Route path="/manage-account/:userId" element={<ManageAccount />} />
          <Route path="/analysis/:userId" element={<Analysis />} />
          <Route
            path="/carbon-footprint/:draftId"
            element={<CarbonFootprint />}
          />
          <Route path="/carbon-footprint" element={<CarbonFootprint />} />
          <Route path="/product-analysis" element={<ProductAnalysis />} />
          <Route
            path="/inventory-management"
            element={<InventoryManagement />}
          />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/csv-upload" element={<CsvUpload />} />
          <Route path="/export-report/:draftId" element={<ExportReport />} />
          <Route path="/news" element={<News />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
