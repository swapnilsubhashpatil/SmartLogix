import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; // adjust as needed

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // to prevent early redirect
  const navigate = useNavigate();

  const validateToken = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/protectedRoute`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      setIsAuthenticated(false);
      localStorage.removeItem("token"); // Optional: clear invalid token
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateToken(); // Initial check on mount

    const interval = setInterval(() => {
      validateToken(); // Periodic validation
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) return null; // or <Loader />

  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
