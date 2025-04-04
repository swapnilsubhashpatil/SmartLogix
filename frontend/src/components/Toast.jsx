import React, { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Toast Component
const Toast = ({ type, message }) => {
  // Trigger toast based on type when component mounts or props change
  useEffect(() => {
    if (!message) return; // Do nothing if no message

    const toastOptions = {
      position: "top-right", // Default position
      autoClose: 5000, // 5 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: { maxWidth: "500px" }, // Mobile-friendly max width
    };

    switch (type) {
      case "success":
        toast.success(message, toastOptions);
        break;
      case "error":
        toast.error(message, toastOptions);
        break;
      case "info":
        toast.info(message, toastOptions);
        break;
      case "warning":
        toast.warn(message, toastOptions);
        break;
      default:
        toast(message, toastOptions); // Fallback to default toast
        break;
    }
  }, [type, message]); // Re-run effect when type or message changes

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      style={{ width: "auto", maxWidth: "500px" }} // Ensure container matches toast width
      className="toast-container" // For additional custom styling if needed
    />
  );
};

export default Toast;
