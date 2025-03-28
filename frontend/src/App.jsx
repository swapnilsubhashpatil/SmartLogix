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
          path="/map/:routeId/:routeData"
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
          path="/carbon-footprint/:carbonKey"
          element={
            <ProtectedRoute>
              <CarbonFootprint />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
