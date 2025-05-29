import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Tabs,
  Tab,
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Box,
  Card,
  CardContent,
  Chip,
  Backdrop,
  Fade,
} from "@mui/material";
import {
  Add,
  Delete,
  LocalShipping,
  CheckCircle,
  Warning,
  Schedule,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "./Toast";
import HomeIcon from "@mui/icons-material/Home";
import { countryOptions } from "./constants";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [drafts, setDrafts] = useState([]);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    "yet-to-be-checked": 0,
    "non-compliant": 0,
    compliant: 0,
    "ready-for-shipment": 0,
  });
  const [loading, setLoading] = useState(false);
  const [toastProps, setToastProps] = useState({ type: "", message: "" });
  const [openDialog, setOpenDialog] = useState(false);
  const [newDraft, setNewDraft] = useState({
    originCountry: "",
    destinationCountry: "",
    hsCode: "",
    productDescription: "",
    perishable: false,
    hazardous: false,
    weight: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const toHome = () => {
    navigate("/dashboard");
  };

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setToastProps({
          type: "error",
          message: "Please log in to view drafts.",
        });
        navigate("/");
        return;
      }

      const tabValues = [
        "yet-to-be-checked",
        "compliant",
        "non-compliant",
        "ready-for-shipment",
      ];
      const draftPromises = tabValues.map((tab) =>
        axios.get(`${BACKEND_URL}/api/drafts`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { tab },
        })
      );

      const responses = await Promise.all(draftPromises);
      const allDrafts = responses.flatMap(
        (response) => response.data.drafts || []
      );

      // Standardize compliance status
      const standardizedDrafts = allDrafts.map((draft) => ({
        ...draft,
        statuses: {
          ...draft.statuses,
          compliance:
            draft.statuses.compliance === "Ready" ||
            draft.statuses.compliance === "Compliant"
              ? "compliant"
              : draft.statuses.compliance,
        },
      }));

      const uniqueDrafts = Array.from(
        new Map(
          standardizedDrafts.map((draft) => [draft._id.toString(), draft])
        ).values()
      );

      // Compute tab counts
      const counts = {
        all: uniqueDrafts.length,
        "yet-to-be-checked": 0,
        "non-compliant": 0,
        compliant: 0,
        "ready-for-shipment": 0,
      };

      uniqueDrafts.forEach((draft) => {
        const compliance = draft.statuses?.compliance;
        const routeOpt = draft.statuses?.routeOptimization;
        if (
          compliance === "notDone" &&
          (routeOpt === "notDone" || routeOpt === "done")
        ) {
          counts["yet-to-be-checked"]++;
        } else if (compliance === "nonCompliant" && routeOpt === "notDone") {
          counts["non-compliant"]++;
        } else if (compliance === "compliant" && routeOpt === "notDone") {
          counts.compliant++;
        } else if (compliance === "compliant" && routeOpt === "done") {
          counts["ready-for-shipment"]++;
        }
      });

      setDrafts(uniqueDrafts);
      setTabCounts(counts);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to fetch drafts.";
      setToastProps({ type: "error", message: errorMessage });
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getFilteredDrafts = () => {
    if (activeTab === "all") return drafts;

    return drafts.filter((draft) => {
      const compliance = draft.statuses?.compliance;
      const routeOpt = draft.statuses?.routeOptimization;
      switch (activeTab) {
        case "yet-to-be-checked":
          return (
            compliance === "notDone" &&
            (routeOpt === "notDone" || routeOpt === "done")
          );
        case "non-compliant":
          return compliance === "nonCompliant" && routeOpt === "notDone";
        case "compliant":
          return compliance === "compliant" && routeOpt === "notDone";
        case "ready-for-shipment":
          return compliance === "compliant" && routeOpt === "done";
        default:
          return false;
      }
    });
  };

  const handleActionClick = (draft) => {
    const compliance = draft.statuses?.compliance;
    const routeOpt = draft.statuses?.routeOptimization;
    if (compliance === "notDone" || compliance === "nonCompliant") {
      navigate(`/compliance-check?draftId=${draft._id}`);
    } else if (compliance === "compliant" && routeOpt === "notDone") {
      navigate(`/route-optimization?draftId=${draft._id}`);
    }
  };

  const handleDeleteDraft = async (draftId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/api/drafts/${draftId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setToastProps({
        type: "success",
        message: "Draft deleted successfully.",
      });
      fetchDrafts();
    } catch (error) {
      console.error("Error deleting draft:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete draft.";
      setToastProps({ type: "error", message: errorMessage });
    }
  };

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setNewDraft({
      originCountry: "",
      destinationCountry: "",
      hsCode: "",
      productDescription: "",
      perishable: false,
      hazardous: false,
      weight: "",
    });
    setFormErrors({});
    setSubmitting(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewDraft((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!newDraft.originCountry)
      errors.originCountry = "Origin Country is required";
    if (!newDraft.destinationCountry)
      errors.destinationCountry = "Destination Country is required";
    if (!newDraft.hsCode) errors.hsCode = "HS Code is required";
    if (!newDraft.productDescription)
      errors.productDescription = "Product Description is required";
    if (!newDraft.weight) errors.weight = "Weight is required";
    else if (isNaN(Number(newDraft.weight)) || Number(newDraft.weight) <= 0)
      errors.weight = "Weight must be a positive number";
    return errors;
  };

  const handleCreateDraft = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setToastProps({
          type: "error",
          message: "Please log in to create a draft.",
        });
        navigate("/");
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/drafts`,
        {
          originCountry: newDraft.originCountry,
          destinationCountry: newDraft.destinationCountry,
          hsCode: newDraft.hsCode,
          productDescription: newDraft.productDescription,
          perishable: newDraft.perishable,
          hazardous: newDraft.hazardous,
          weight: Number(newDraft.weight),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setToastProps({
        type: "success",
        message: "Draft created successfully!",
      });
      handleDialogClose();
      fetchDrafts();
    } catch (error) {
      console.error("Error creating draft:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to create draft.";
      setToastProps({ type: "error", message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (compliance, routeOpt) => {
    if (compliance === "compliant" && routeOpt === "done") {
      return <LocalShipping sx={{ color: "#10b981", fontSize: 20 }} />;
    } else if (compliance === "compliant") {
      return <CheckCircle sx={{ color: "#059669", fontSize: 20 }} />;
    } else if (compliance === "nonCompliant") {
      return <Warning sx={{ color: "#dc2626", fontSize: 20 }} />;
    } else {
      return <Schedule sx={{ color: "#f59e0b", fontSize: 20 }} />;
    }
  };

  const getStatusColor = (compliance, routeOpt) => {
    if (compliance === "compliant" && routeOpt === "done") {
      return "#10b981";
    } else if (compliance === "compliant") {
      return "#059669";
    } else if (compliance === "nonCompliant") {
      return "#dc2626";
    } else {
      return "#f59e0b";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6">
      {/* Header remains unchanged */}
      <header className="relative bg-gradient-to-r from-teal-200 to-blue-400 text-white py-6 sm:py-8 rounded-b-3xl overflow-hidden w-full">
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
              <HomeIcon
                onClick={toHome}
                sx={{ color: "#000", cursor: "pointer" }}
              />
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Route Optimization
            </h1>
          </div>
          <div></div>
        </div>
      </header>

      {/* Enhanced Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Enhanced Tabs */}
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            mb: 4,
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textTransform: "none",
                  minHeight: 64,
                  color: "#64748b",
                  "&.Mui-selected": {
                    color: "#0f172a",
                    background:
                      "linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%)",
                  },
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                  borderRadius: 2,
                  background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                },
              }}
            >
              <Tab label={`All (${tabCounts.all})`} value="all" />
              <Tab
                label={`Yet to be Checked (${tabCounts["yet-to-be-checked"]})`}
                value="yet-to-be-checked"
              />
              <Tab
                label={`Non-compliant (${tabCounts["non-compliant"]})`}
                value="non-compliant"
              />
              <Tab
                label={`Compliant (${tabCounts.compliant})`}
                value="compliant"
              />
              <Tab
                label={`Ready for Shipment (${tabCounts["ready-for-shipment"]})`}
                value="ready-for-shipment"
              />
            </Tabs>
          </Box>
        </Card>

        {/* Enhanced Content Area */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <CircularProgress size={50} sx={{ color: "white" }} />
                <Typography sx={{ color: "white", fontWeight: 500 }}>
                  Loading drafts...
                </Typography>
              </Box>
            </div>
          ) : getFilteredDrafts().length === 0 ? (
            <Card
              sx={{
                borderRadius: 3,
                p: 6,
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
                No drafts available
              </Typography>
              <Typography sx={{ color: "#94a3b8" }}>
                {activeTab === "yet-to-be-checked"
                  ? "Create your first draft to get started!"
                  : "No drafts match this category."}
              </Typography>
            </Card>
          ) : (
            getFilteredDrafts().map((draft, index) => (
              <motion.div
                key={draft._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    borderRadius: 3,
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left Section - Content */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(
                            draft.statuses?.compliance,
                            draft.statuses?.routeOptimization
                          )}
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: "#1e293b",
                              fontSize: "1.1rem",
                            }}
                          >
                            Draft {index + 1}
                          </Typography>
                          <Chip
                            label={
                              draft.statuses?.compliance === "compliant" &&
                              draft.statuses?.routeOptimization === "done"
                                ? "Ready for Shipment"
                                : draft.statuses?.compliance === "compliant"
                                ? "Compliant"
                                : draft.statuses?.compliance === "nonCompliant"
                                ? "Non-compliant"
                                : "Pending Review"
                            }
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(
                                draft.statuses?.compliance,
                                draft.statuses?.routeOptimization
                              ),
                              color: "white",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ color: "#64748b", fontWeight: 600 }}
                            >
                              HS Code
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#1e293b", fontWeight: 500 }}
                            >
                              {draft.formData?.ShipmentDetails?.["HS Code"] ||
                                "N/A"}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ color: "#64748b", fontWeight: 600 }}
                            >
                              Created
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#1e293b", fontWeight: 500 }}
                            >
                              {new Date(draft.timestamp).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </div>

                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: "#64748b", fontWeight: 600 }}
                          >
                            Product Description
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "#1e293b", fontWeight: 500, mt: 0.5 }}
                          >
                            {draft.formData?.ShipmentDetails?.[
                              "Product Description"
                            ] || "N/A"}
                          </Typography>
                        </Box>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="contained"
                          onClick={() => handleActionClick(draft)}
                          style={{
                            display:
                              draft.statuses?.compliance === "compliant" &&
                              draft.statuses?.routeOptimization === "done"
                                ? "none"
                                : "block",
                          }}
                          sx={{
                            background:
                              "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                              transform: "translateY(-1px)",
                              boxShadow: "0 6px 20px rgba(59, 130, 246, 0.5)",
                            },
                          }}
                        >
                          {draft.statuses?.compliance === "compliant" &&
                          draft.statuses?.routeOptimization === "notDone"
                            ? "Optimize Route"
                            : "Check Compliance"}
                        </Button>

                        {draft.statuses?.compliance === "compliant" &&
                          draft.statuses?.routeOptimization === "done" && (
                            <Button
                              variant="contained"
                              onClick={() =>
                                navigate(`/export-report/${draft._id}`)
                              }
                              sx={{
                                background:
                                  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                px: 3,
                                py: 1,
                                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                                "&:hover": {
                                  background:
                                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                  transform: "translateY(-1px)",
                                  boxShadow:
                                    "0 6px 20px rgba(16, 185, 129, 0.5)",
                                },
                              }}
                            >
                              Export Report
                            </Button>
                          )}

                        <IconButton
                          onClick={() => handleDeleteDraft(draft._id)}
                          sx={{
                            color: "#ef4444",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            borderRadius: 2,
                            "&:hover": {
                              backgroundColor: "rgba(239, 68, 68, 0.2)",
                              transform: "scale(1.05)",
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Enhanced Floating Action Button */}
        {activeTab === "yet-to-be-checked" && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Button
              variant="contained"
              onClick={handleDialogOpen}
              sx={{
                position: "fixed",
                bottom: 24,
                right: 24,
                borderRadius: "50%",
                width: 64,
                height: 64,
                minWidth: 0,
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                boxShadow: "0 8px 32px rgba(245, 158, 11, 0.4)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                  transform: "scale(1.1)",
                  boxShadow: "0 12px 40px rgba(245, 158, 11, 0.6)",
                },
                transition: "all 0.3s ease",
              }}
            >
              <Add sx={{ fontSize: 28 }} />
            </Button>
          </motion.div>
        )}

        {/* Enhanced Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleDialogClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
              backdropFilter: "blur(10px)",
            },
          }}
          BackdropComponent={Backdrop}
          BackdropProps={{
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              color: "white",
              fontWeight: 700,
              textAlign: "center",
              fontSize: "1.5rem",
              py: 3,
            }}
          >
            Create New Draft
          </DialogTitle>
          <DialogContent sx={{ p: 4, mt: 2 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormControl fullWidth>
                <InputLabel>Origin Country</InputLabel>
                <Select
                  name="originCountry"
                  value={newDraft.originCountry}
                  onChange={handleInputChange}
                  label="Origin Country"
                  error={!!formErrors.originCountry}
                  sx={{ borderRadius: 2 }}
                >
                  {countryOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.originCountry && (
                  <Typography color="error" variant="caption">
                    {formErrors.originCountry}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Destination Country</InputLabel>
                <Select
                  name="destinationCountry"
                  value={newDraft.destinationCountry}
                  onChange={handleInputChange}
                  label="Destination Country"
                  error={!!formErrors.destinationCountry}
                  sx={{ borderRadius: 2 }}
                >
                  {countryOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.destinationCountry && (
                  <Typography color="error" variant="caption">
                    {formErrors.destinationCountry}
                  </Typography>
                )}
              </FormControl>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <TextField
                fullWidth
                label="HS Code"
                name="hsCode"
                value={newDraft.hsCode}
                onChange={handleInputChange}
                error={!!formErrors.hsCode}
                helperText={formErrors.hsCode}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                label="Weight (kg)"
                name="weight"
                type="number"
                value={newDraft.weight}
                onChange={handleInputChange}
                error={!!formErrors.weight}
                helperText={formErrors.weight}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </div>

            <TextField
              fullWidth
              label="Product Description"
              name="productDescription"
              value={newDraft.productDescription}
              onChange={handleInputChange}
              error={!!formErrors.productDescription}
              helperText={formErrors.productDescription}
              multiline
              rows={3}
              sx={{
                mt: 4,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />

            <Box sx={{ display: "flex", gap: 3, mt: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="perishable"
                    checked={newDraft.perishable}
                    onChange={handleInputChange}
                    sx={{
                      color: "#3b82f6",
                      "&.Mui-checked": { color: "#3b82f6" },
                    }}
                  />
                }
                label="Perishable"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="hazardous"
                    checked={newDraft.hazardous}
                    onChange={handleInputChange}
                    sx={{
                      color: "#3b82f6",
                      "&.Mui-checked": { color: "#3b82f6" },
                    }}
                  />
                }
                label="Hazardous"
              />
            </Box>

            {submitting && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 4, justifyContent: "space-between", gap: 2 }}>
            <Button
              onClick={handleDialogClose}
              variant="outlined"
              sx={{
                borderColor: "#64748b",
                color: "#64748b",
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#475569",
                  color: "#475569",
                  backgroundColor: "rgba(100, 116, 139, 0.04)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDraft}
              variant="contained"
              disabled={submitting}
              sx={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                  boxShadow: "0 6px 20px rgba(59, 130, 246, 0.5)",
                },
                "&:disabled": {
                  background: "#94a3b8",
                  boxShadow: "none",
                },
              }}
            >
              {submitting ? "Creating..." : "Create Draft"}
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      <Toast type={toastProps.type} message={toastProps.message} />
    </div>
  );
};

export default InventoryManagement;
