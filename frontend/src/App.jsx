import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import CreateAccount from "./pages/auth/CreateAccount";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/dashboard/Dashboard";
import ComplianceCheck from "./pages/compliance-check/ComplianceCheck";
import RouteOptimization from "./pages/route-optimization/RouteOptimization";
import RouteMap from "./pages/route-optimization/route";
import Profile from "./pages/profile/Profile";
import History from "./pages/profile/History";
import ManageAccount from "./pages/profile/ManageAccount";
import Analysis from "./pages/profile/Analysis";
import CarbonFootprint from "./pages/route-optimization/CarbonFootprint";
import ProductAnalysis from "./pages/compliance-check/ProductAnalysis";
import InventoryManagement from "./pages/inventory-management/InventoryManagement";
import Compliance from "./pages/compliance-check/Compliance";
import CsvUpload from "./pages/compliance-check/CsvUpload";
import ExportReport from "./pages/inventory-management/ExportReport";
import News from "./pages/news/News";
import DocumentationPage from "./pages/documentation/DocumentationPage";

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
          <Route path="/docs" element={<DocumentationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
