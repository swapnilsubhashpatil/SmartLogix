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
        {/* <Route
          path="/route-optimization"
          element={
            <ProtectedRoute>
              <Mapping />
            </ProtectedRoute>
          }
        />
        <Route
          path="/route"
          element={
            <ProtectedRoute>
              <RouteOptimization />
            </ProtectedRoute>
          }
        /> */}
        <Route path="/route-optimization" element={<RouteOptimization />} />
        <Route path="/map/:routeId/:routeData" element={<RouteMap />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
