import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaUser,
  FaLock,
  FaTrash,
  FaEnvelope,
  FaCamera,
  FaCheckCircle,
  FaExclamationCircle,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import Toast from "./Toast";
import Header from "./Header";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ManageAccount = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    profilePhoto: "",
    phoneNumber: "",
    companyName: "",
    companyAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    taxId: "",
  });
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteEmail, setDeleteEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastProps, setToastProps] = useState({ type: "", message: "" });
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phoneNumber: "",
    companyName: "",
    companyAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    taxId: "",
  });
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/protectedRoute`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = response.data.user;

        // Ensure userData is valid
        if (!userData) {
          throw new Error("User data not found in response");
        }

        // Set user state
        setUser(userData);

        // Set username (firstName and lastName)
        setNewUsername(
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
        );

        // Set profile form with all required fields, providing defaults if missing
        setProfileForm({
          phoneNumber: userData.phoneNumber || "",
          companyName: userData.companyName || "",
          companyAddress: {
            street: userData.companyAddress?.street || "",
            city: userData.companyAddress?.city || "",
            state: userData.companyAddress?.state || "",
            postalCode: userData.companyAddress?.postalCode || "",
            country: userData.companyAddress?.country || "",
          },
          taxId: userData.taxId || "",
        });

        // Calculate profile completion with the updated user data
        calculateProfileCompletion(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setToastProps({ type: "error", message: "Failed to load user data." });

        // Set default profile form values in case of error to prevent UI issues
        setProfileForm({
          phoneNumber: "",
          companyName: "",
          companyAddress: {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
          },
          taxId: "",
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [token]);

  const calculateProfileCompletion = (userData) => {
    const fields = [
      userData.firstName,
      userData.lastName,
      userData.emailAddress,
      userData.phoneNumber,
      userData.companyName,
      userData.companyAddress?.street,
      userData.taxId,
      userData.profilePhoto,
    ];
    const filledFields = fields.filter(
      (field) => field && field.trim() !== ""
    ).length;
    const completionPercentage = (filledFields / fields.length) * 100;
    setProfileCompletion(completionPercentage.toFixed(0));
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    try {
      const [firstName, ...lastNameParts] = newUsername.trim().split(" ");
      const lastName = lastNameParts.join(" ") || undefined;
      const response = await axios.put(
        `${BACKEND_URL}/api/user/update-username`,
        { firstName, lastName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = {
        ...user,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
      };
      setUser(updatedUser);
      setToastProps({
        type: "success",
        message: "Username updated successfully!",
      });
      setIsEditingUsername(false);
      calculateProfileCompletion(updatedUser);
    } catch (error) {
      console.error("Error updating username:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update username.";
      setToastProps({ type: "error", message: errorMessage });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToastProps({ type: "error", message: "Passwords do not match." });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setToastProps({
        type: "error",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }
    try {
      await axios.put(
        `${BACKEND_URL}/api/user/update-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastProps({
        type: "success",
        message: "Password updated successfully!",
      });
      setNewPassword("");
      setConfirmPassword("");
      setIsEditingPassword(false);
    } catch (error) {
      console.error("Error updating password:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update password.";
      setToastProps({ type: "error", message: errorMessage });
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/user/update-profile`,
        profileForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = response.data.user;
      setUser(updatedUser);
      setToastProps({
        type: "success",
        message: "Profile updated successfully!",
      });
      setIsEditingProfile(false);
      calculateProfileCompletion(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update profile.";
      setToastProps({ type: "error", message: errorMessage });
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteEmail !== user.emailAddress) {
      setToastProps({
        type: "error",
        message: "Email does not match. Please enter your correct email.",
      });
      return;
    }
    try {
      await axios.delete(`${BACKEND_URL}/api/user/delete-account`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setToastProps({
        type: "success",
        message: "Account deleted successfully!",
      });
      setTimeout(() => {
        localStorage.removeItem("token");
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete account.";
      setToastProps({ type: "error", message: errorMessage });
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!profilePhoto) {
      setToastProps({
        type: "error",
        message: "Please select a photo to upload.",
      });
      return;
    }
    const formData = new FormData();
    formData.append("photo", profilePhoto);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/user/upload-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const updatedUser = { ...user, profilePhoto: response.data.signedUrl };
      setUser(updatedUser);
      setPreviewPhoto(null);
      setProfilePhoto(null);
      fileInputRef.current.value = null;
      calculateProfileCompletion(updatedUser);
      setToastProps({
        type: "success",
        message: "Profile photo uploaded successfully!",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to upload profile photo.";
      setToastProps({ type: "error", message: errorMessage });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setPreviewPhoto(URL.createObjectURL(file));
    }
  };

  const handleCancelEdit = (section) => {
    if (section === "username") {
      setNewUsername(`${user.firstName} ${user.lastName || ""}`.trim());
      setIsEditingUsername(false);
    } else if (section === "password") {
      setNewPassword("");
      setConfirmPassword("");
      setIsEditingPassword(false);
    } else if (section === "profile") {
      setProfileForm({
        phoneNumber: user.phoneNumber || "",
        companyName: user.companyName || "",
        companyAddress: {
          street: user.companyAddress?.street || "",
          city: user.companyAddress?.city || "",
          state: user.companyAddress?.state || "",
          postalCode: user.companyAddress?.postalCode || "",
          country: user.companyAddress?.country || "",
        },
        taxId: user.taxId || "",
      });
      setIsEditingProfile(false);
    }
  };

  const handleProfileFormChange = (field, value) => {
    if (field.startsWith("companyAddress.")) {
      const addressField = field.split(".")[1];
      setProfileForm({
        ...profileForm,
        companyAddress: {
          ...profileForm.companyAddress,
          [addressField]: value,
        },
      });
    } else {
      setProfileForm({
        ...profileForm,
        [field]: value,
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6">
      <Header title="Manage Account" />
      {loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Manage Account
          </h1>

          {/* Profile Completion */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Profile Completion
                </h2>
                <span className="text-lg font-medium text-blue-600">
                  {profileCompletion}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
              <p className="text-gray-600 text-sm">
                {profileCompletion < 100 ? (
                  <>
                    <FaExclamationCircle className="inline mr-1 text-yellow-500" />
                    Finish setting up your profile so we can offer more
                    personalized suggestions and features.
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="inline mr-1 text-green-500" />
                    Your profile is fully complete! Great job!
                  </>
                )}
              </p>
            </div>
          </motion.div>

          {/* User Info and Photo */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover shadow-lg"
                      onError={(e) => {
                        console.error("Failed to load profile photo:", e);
                        e.target.src = "/placeholder-image.jpg";
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <FaUser className="text-4xl text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {user.firstName} {user.lastName || ""}
                  </h2>
                  <p className="text-gray-600">{user.emailAddress}</p>
                </div>
              </div>

              {/* Photo Upload */}
              <form onSubmit={handlePhotoUpload} className="mt-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Upload Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    ref={fileInputRef}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {previewPhoto && (
                    <img
                      src={previewPhoto}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm"
                >
                  <FaCamera /> Upload Photo
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Update Username */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Update Username
                </h2>
                {!isEditingUsername && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditingUsername(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl shadow-sm"
                  >
                    <FaEdit /> Update
                  </motion.button>
                )}
              </div>
              <form onSubmit={handleUpdateUsername}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={!isEditingUsername}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                {isEditingUsername && (
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm"
                    >
                      <FaSave /> Save
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => handleCancelEdit("username")}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl shadow-sm"
                    >
                      <FaTimes /> Cancel
                    </motion.button>
                  </div>
                )}
              </form>
            </div>
          </motion.div>

          {/* Profile Information */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Profile Information
                </h2>
                {!isEditingProfile && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl shadow-sm"
                  >
                    <FaEdit /> Update
                  </motion.button>
                )}
              </div>
              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phoneNumber}
                        onChange={(e) =>
                          handleProfileFormChange("phoneNumber", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.companyName}
                        onChange={(e) =>
                          handleProfileFormChange("companyName", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={profileForm.companyAddress.street}
                        onChange={(e) =>
                          handleProfileFormChange(
                            "companyAddress.street",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={profileForm.companyAddress.city}
                        onChange={(e) =>
                          handleProfileFormChange(
                            "companyAddress.city",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={profileForm.companyAddress.state}
                        onChange={(e) =>
                          handleProfileFormChange(
                            "companyAddress.state",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={profileForm.companyAddress.postalCode}
                        onChange={(e) =>
                          handleProfileFormChange(
                            "companyAddress.postalCode",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter postal code"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={profileForm.companyAddress.country}
                        onChange={(e) =>
                          handleProfileFormChange(
                            "companyAddress.country",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter country"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Tax ID
                      </label>
                      <input
                        type="text"
                        value={profileForm.taxId}
                        onChange={(e) =>
                          handleProfileFormChange("taxId", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter tax ID"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm"
                    >
                      <FaSave /> Save
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => handleCancelEdit("profile")}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl shadow-sm"
                    >
                      <FaTimes /> Cancel
                    </motion.button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 font-medium">Phone Number:</p>
                    <p className="text-gray-600">
                      {user.phoneNumber || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Company Name:</p>
                    <p className="text-gray-600">
                      {user.companyName || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Street Address:</p>
                    <p className="text-gray-600">
                      {user.companyAddress?.street || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">City:</p>
                    <p className="text-gray-600">
                      {user.companyAddress?.city || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">State:</p>
                    <p className="text-gray-600">
                      {user.companyAddress?.state || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Postal Code:</p>
                    <p className="text-gray-600">
                      {user.companyAddress?.postalCode || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Country:</p>
                    <p className="text-gray-600">
                      {user.companyAddress?.country || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Tax ID:</p>
                    <p className="text-gray-600">
                      {user.taxId || "Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Update Password */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Update Password
                </h2>
                {!isEditingPassword && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditingPassword(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl shadow-sm"
                  >
                    <FaEdit /> Update
                  </motion.button>
                )}
              </div>
              {isEditingPassword ? (
                <form onSubmit={handleUpdatePassword}>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm"
                    >
                      <FaSave /> Save
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => handleCancelEdit("password")}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl shadow-sm"
                    >
                      <FaTimes /> Cancel
                    </motion.button>
                  </div>
                </form>
              ) : null}
            </div>
          </motion.div>

          {/* Delete Account */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Delete Account
              </h2>
              <p className="text-red-600 mb-4">
                Warning: This action is irreversible. All your data will be
                permanently deleted.
              </p>
              <form onSubmit={handleDeleteAccount}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Enter your email to confirm
                  </label>
                  <input
                    type="email"
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl shadow-sm"
                >
                  <FaTrash /> Delete Account
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      <Toast type={toastProps.type} message={toastProps.message} />
    </div>
  );
};

export default ManageAccount;
