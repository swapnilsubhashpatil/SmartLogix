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
import Header from "./Header";

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
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteDraftId, setDeleteDraftId] = useState(null);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteEmailError, setDeleteEmailError] = useState("");
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
    const draft = drafts.find((d) => d._id === draftId);
    if (
      draft &&
      draft.statuses?.compliance === "compliant" &&
      draft.statuses?.routeOptimization === "done"
    ) {
      setDeleteDraftId(draftId);
      setOpenDeleteDialog(true);
      return;
    }

    await proceedWithDelete(draftId);
  };

  const proceedWithDelete = async (draftId) => {
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

  const handleDeleteConfirm = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!deleteEmail || !emailRegex.test(deleteEmail)) {
      setDeleteEmailError("Please enter a valid email address.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setDeleteEmailError("Authentication required. Please log in.");
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/protectedRoute`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userEmail = response.data.user.emailAddress;

      if (deleteEmail.toLowerCase() !== userEmail.toLowerCase()) {
        setDeleteEmailError("The email does not match your account email.");
        return;
      }

      proceedWithDelete(deleteDraftId);
      setOpenDeleteDialog(false);
      setDeleteDraftId(null);
      setDeleteEmail("");
      setDeleteEmailError("");
    } catch (error) {
      console.error("Error verifying email:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to verify email.";
      setDeleteEmailError(errorMessage);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setDeleteDraftId(null);
    setDeleteEmail("");
    setDeleteEmailError("");
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
    <div className="min-h-screen bg-neutral-100 p-2 sm:p-4 md:p-6">
      <Header title="Inventory" page="profile" />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-6 md:py-8">
        {/* Optimized Tabs */}
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            mb: 4,
            overflowX: "auto", // Ensure horizontal scrolling on mobile
          }}
        >
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                height: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#94a3b8",
                borderRadius: "10px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f5f9",
              },
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                "& .MuiTabs-flexContainer": {
                  justifyContent: { xs: "flex-start", sm: "center" },
                },
                "& .MuiTab-root": {
                  fontWeight: 600,
                  fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.95rem" },
                  textTransform: "none",
                  minHeight: { xs: 40, sm: 48 },
                  minWidth: { xs: 90, sm: 120 },
                  padding: { xs: "8px 12px", sm: "12px 16px" },
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
                "& .MuiTabs-scrollButtons": {
                  width: { xs: 30, sm: 40 },
                  color: "#3b82f6",
                  "&.Mui-disabled": {
                    opacity: 0.3,
                  },
                },
              }}
            >
              <Tab label={`All (${tabCounts.all})`} value="all" />
              <Tab
                label={
                  window.innerWidth < 600
                    ? `Pending (${tabCounts["yet-to-be-checked"]})`
                    : `Yet to be Checked (${tabCounts["yet-to-be-checked"]})`
                }
                value="yet-to-be-checked"
              />
              <Tab
                label={
                  window.innerWidth < 600
                    ? `Non-compliant (${tabCounts["non-compliant"]})`
                    : `Non-compliant (${tabCounts["non-compliant"]})`
                }
                value="non-compliant"
              />
              <Tab
                label={
                  window.innerWidth < 600
                    ? `Compliant (${tabCounts.compliant})`
                    : `Compliant (${tabCounts.compliant})`
                }
                value="compliant"
              />
              <Tab
                label={
                  window.innerWidth < 600
                    ? `Ready (${tabCounts["ready-for-shipment"]})`
                    : `Ready for Shipment (${tabCounts["ready-for-shipment"]})`
                }
                value="ready-for-shipment"
              />
            </Tabs>
          </Box>
        </Card>

        {/* Rest of the component remains unchanged */}
        <div className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="flex justify-center py-8 sm:py-12">
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
                p: { xs: 4, sm: 6 },
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "#64748b",
                  mb: 1,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                }}
              >
                No drafts available
              </Typography>
              <Typography
                sx={{
                  color: "#94a3b8",
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                }}
              >
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
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {getStatusIcon(
                            draft.statuses?.compliance,
                            draft.statuses?.routeOptimization
                          )}
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: "#1e293b",
                              fontSize: { xs: "1rem", sm: "1.1rem" },
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
                              fontSize: { xs: "0.65rem", sm: "0.75rem" },
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#64748b",
                                fontWeight: 600,
                                fontSize: { xs: "0.85rem", sm: "0.9rem" },
                              }}
                            >
                              HS Code
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#1e293b",
                                fontWeight: 500,
                                fontSize: { xs: "0.85rem", sm: "0.9rem" },
                              }}
                            >
                              {draft.formData?.ShipmentDetails?.["HS Code"] ||
                                "N/A"}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#64748b",
                                fontWeight: 600,
                                fontSize: { xs: "0.85rem", sm: "0.9rem" },
                              }}
                            >
                              Created
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#1e293b",
                                fontWeight: 500,
                                fontSize: { xs: "0.85rem", sm: "0.9rem" },
                              }}
                            >
                              {new Date(draft.timestamp).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </div>

                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#64748b",
                              fontWeight: 600,
                              fontSize: { xs: "0.85rem", sm: "0.9rem" },
                            }}
                          >
                            Product Description
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#1e293b",
                              fontWeight: 500,
                              mt: 0.5,
                              fontSize: { xs: "0.85rem", sm: "0.9rem" },
                            }}
                          >
                            {draft.formData?.ShipmentDetails?.[
                              "Product Description"
                            ] || "N/A"}
                          </Typography>
                        </Box>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
                            px: { xs: 2, sm: 3 },
                            py: 1,
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
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
                                px: { xs: 2, sm: 3 },
                                py: 1,
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
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

        {activeTab === "yet-to-be-checked" && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Button
              variant="contained"
              onClick={handleDialogOpen}
              sx={{
                position: "fixed",
                bottom: { xs: 16, sm: 24 },
                right: { xs: 16, sm: 24 },
                borderRadius: "50%",
                width: { xs: 48, sm: 64 },
                height: { xs: 48, sm: 64 },
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
              <Add sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Button>
          </motion.div>
        )}

        <Dialog
          open={openDeleteDialog}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              backgroundColor: "#ef4444",
              color: "white",
              fontWeight: 700,
              textAlign: "center",
              fontSize: "1.25rem",
              py: 2,
            }}
          >
            Warning: Deleting Draft
          </DialogTitle>
          <DialogContent sx={{ p: 4, mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This choice may negatively affect your sustainability rating and
              disrupt overall analysis records.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Please enter your email to proceed:
            </Typography>
            <TextField
              fullWidth
              label="Email"
              value={deleteEmail}
              onChange={(e) => {
                setDeleteEmail(e.target.value);
                setDeleteEmailError("");
              }}
              error={!!deleteEmailError}
              helperText={deleteEmailError}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 4, justifyContent: "space-between", gap: 2 }}>
            <Button
              onClick={handleDeleteCancel}
              variant="outlined"
              sx={{
                borderColor: "#64748b",
                color: "#64748b",
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openDialog}
          onClose={handleDialogClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
              m: { xs: 1, sm: 2 },
              width: { xs: "90%", sm: "80%", md: "70%" },
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
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              py: { xs: 2, sm: 3 },
            }}
          >
            Create New Draft
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 3, sm: 4 }, mt: 2 }}>
            <div className="w-full flex flex-col gap-4 items-center justify-center">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateDraft();
                }}
                className="w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-black/10"
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full justify-center items-center flex-wrap">
                  <div className="relative w-full max-w-xs">
                    <select
                      name="originCountry"
                      value={newDraft.originCountry}
                      onChange={handleInputChange}
                      required
                      className="peer w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-gray-300/40 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/60 transition-all duration-300 hover:bg-white/50 hover:scale-[1.02] hover:shadow-lg hover:border-gray-400/60 active:scale-[0.98] appearance-none"
                    >
                      <option value="" disabled>
                        Select Origin Country
                      </option>
                      {countryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <label className="absolute left-4 -top-2.5 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-sm font-medium text-gray-600 transition-all duration-300">
                      Origin Country
                    </label>
                    {formErrors.originCountry && (
                      <Typography color="error" variant="caption">
                        {formErrors.originCountry}
                      </Typography>
                    )}
                  </div>

                  <div className="relative w-full max-w-xs">
                    <select
                      name="destinationCountry"
                      value={newDraft.destinationCountry}
                      onChange={handleInputChange}
                      required
                      className="peer w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-gray-300/40 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/60 transition-all duration-300 hover:bg-white/50 hover:scale-[1.02] hover:shadow-lg hover:border-gray-400/60 active:scale-[0.98] appearance-none"
                    >
                      <option value="" disabled>
                        Select Destination Country
                      </option>
                      {countryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <label className="absolute left-4 -top-2.5 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-sm font-medium text-gray-600 transition-all duration-300">
                      Destination Country
                    </label>
                    {formErrors.destinationCountry && (
                      <Typography color="error" variant="caption">
                        {formErrors.destinationCountry}
                      </Typography>
                    )}
                  </div>

                  <div className="relative w-full max-w-xs">
                    <input
                      type="text"
                      id="hsCode"
                      name="hsCode"
                      value={newDraft.hsCode}
                      onChange={handleInputChange}
                      required
                      placeholder=" "
                      className="peer w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-gray-300/40 rounded-2xl text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/60 transition-all duration-300 hover:bg-white/50 hover:scale-[1.02] hover:shadow-lg hover:border-gray-400/60 active:scale-[0.98]"
                    />
                    <label
                      htmlFor="hsCode"
                      className="absolute left-4 -top-2.5 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:left-4 peer-focus:bg-white/80 peer-focus:text-blue-600"
                    >
                      HS Code
                    </label>
                    {formErrors.hsCode && (
                      <Typography color="error" variant="caption">
                        {formErrors.hsCode}
                      </Typography>
                    )}
                  </div>

                  <div className="relative w-full max-w-xs">
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={newDraft.weight}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.1"
                      placeholder=" "
                      className="peer w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-gray-300/40 rounded-2xl text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/60 transition-all duration-300 hover:bg-white/50 hover:scale-[1.02] hover:shadow-lg hover:border-gray-400/60 active:scale-[0.98]"
                    />
                    <label
                      htmlFor="weight"
                      className="absolute left-4 -top-2.5 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:left-4 peer-focus:bg-white/80 peer-focus:text-blue-600"
                    >
                      Weight (kg)
                    </label>
                    {formErrors.weight && (
                      <Typography color="error" variant="caption">
                        {formErrors.weight}
                      </Typography>
                    )}
                  </div>
                </div>

                <div className="relative w-full mt-4">
                  <textarea
                    id="productDescription"
                    name="productDescription"
                    value={newDraft.productDescription}
                    onChange={handleInputChange}
                    required
                    placeholder=" "
                    rows={3}
                    className="peer w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-gray-300/40 rounded-2xl text-gray-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/60 transition-all duration-300 hover:bg-white/50 hover:scale-[1.01] hover:shadow-lg hover:border-gray-400/60 active:scale-[0.99]"
                  />
                  <label
                    htmlFor="productDescription"
                    className="absolute left-4 -top-2.5 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:left-4 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:left-4 peer-focus:bg-white/80 peer-focus:text-blue-600"
                  >
                    Product Description
                  </label>
                  {formErrors.productDescription && (
                    <Typography color="error" variant="caption">
                      {formErrors.productDescription}
                    </Typography>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-4">
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
                </div>

                <div className="mt-6 sm:mt-8 flex justify-center">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl border-2 border-blue-400/30 hover:border-blue-300/50 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-lg min-w-[200px] backdrop-blur-sm"
                  >
                    <span className="flex items-center justify-center gap-3">
                      {submitting ? "Creating..." : "Create Draft"}
                      {submitting && (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Toast type={toastProps.type} message={toastProps.message} />
    </div>
  );
};

export default InventoryManagement;
