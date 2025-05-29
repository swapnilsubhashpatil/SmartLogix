import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Box, Typography, CircularProgress, Button } from "@mui/material";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ExportReport = () => {
  const { draftId } = useParams(); // Get draftId from URL
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastProps, setToastProps] = useState({ type: "", message: "" });

  useEffect(() => {
    console.log("draftId from useParams:", draftId); // Debug log
    if (!draftId) {
      setError("No draft ID provided.");
      setLoading(false);
      setToastProps({ type: "error", message: "No draft ID provided." });
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found.");

        // Fetch draft
        const draftResponse = await axios.get(
          `${BACKEND_URL}/api/drafts/${draftId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDraft(draftResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.error || "Failed to fetch report data.");
        setToastProps({
          type: "error",
          message: "Failed to fetch report data.",
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [draftId]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="error" variant="h6">
          {error}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Export Report
      </Typography>
      <Typography variant="body1">Draft ID: {draftId}</Typography>
      <pre>{JSON.stringify(draft, null, 2)}</pre>
    </Box>
  );
};

export default ExportReport;
