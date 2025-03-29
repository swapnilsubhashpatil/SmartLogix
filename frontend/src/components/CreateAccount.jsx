import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import GoogleLogin from "./GoogleLogin";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CreateAccount = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // New loading state
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle Google redirect (if applicable)
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setLoading(true);
      localStorage.setItem("token", token);
      toast.success("Account Created with Google!", {
        position: "top-right",
        theme: "colored",
      });
      setTimeout(() => {
        navigate("/dashboard");
        setLoading(false);
      }, 1000);
    }
  }, [searchParams, navigate]);

  const handleCreateAccount = async () => {
    if (!firstName || !lastName || !emailAddress || !password) {
      toast.error("Please fill in all fields", {
        position: "top-right",
        theme: "colored",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}}/createAccount`, {
        firstName,
        lastName,
        emailAddress,
        password,
      });

      // Assuming the response includes a token; adjust if your API differs
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      toast.success("Account Created Successfully!", {
        position: "top-right",
        theme: "colored",
      });

      setTimeout(() => {
        navigate("/dashboard");
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Account creation failed", {
        position: "top-right",
        theme: "colored",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col lg:flex-row">
      {/* Left Side - Creative Design */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-500 to-secondary-500 items-center justify-center p-12 overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 bg-primary-200 rounded-full opacity-50"
              initial={{ x: "50%", y: "50%" }}
              animate={{
                x: [
                  `${50 + Math.cos(i * 2) * 100}%`,
                  `${50 + Math.cos(i * 2 + 1) * 100}%`,
                ],
                y: [
                  `${50 + Math.sin(i * 2) * 100}%`,
                  `${50 + Math.sin(i * 2 + 1) * 100}%`,
                ],
              }}
              transition={{
                duration: 5 + i * 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
          <motion.div
            className="absolute w-64 h-64 border-2 border-primary-400/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
        <div className="relative z-10 text-white text-center">
          <h2 className="text-5xl font-bold mb-6 tracking-tight">SmartLogix</h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl mb-10 font-light text-shadow-glow"
            style={{
              textShadow:
                "0 0 8px rgba(55, 151, 119, 0.8), 0 0 16px rgba(55, 151, 119, 0.5)",
            }}
          >
            Logistics, Evolved
          </motion.p>
          <div className="flex flex-col gap-6">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-4 bg-secondary-600/40 backdrop-blur-md p-4 rounded-custom shadow-custom-light glass-reflection relative overflow-hidden transition-all"
            >
              <motion.svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </motion.svg>
              <span className="text-lg font-medium">Compliance Check</span>
            </motion.div>
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-4 bg-secondary-600/40 backdrop-blur-md p-4 rounded-custom shadow-custom-light glass-reflection relative overflow-hidden transition-all"
            >
              <motion.svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </motion.svg>
              <span className="text-lg font-medium">Route Optimization</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Create Account Form or Loading */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-6"
      >
        {loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-[300px] relative"
          >
            {/* Orbital Loading Animation */}
            <div className="relative w-20 h-20">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 bg-primary-500 rounded-full"
                  animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1],
                    x: Math.cos((i * Math.PI) / 2) * 30,
                    y: Math.sin((i * Math.PI) / 2) * 30,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                />
              ))}
              <motion.div
                className="absolute inset-0 border-2 border-primary-400/30 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            {/* Pulsing Text */}
            <motion.p
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mt-6 text-lg font-medium text-primary-600"
            >
              Creating Your SmartLogix Account...
            </motion.p>
          </motion.div>
        ) : (
          <div className="w-full max-w-md bg-neutral-50 rounded-custom shadow-custom-medium p-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-center text-tertiary-500 mb-2"
            >
              Create Account
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center text-neutral-600 mb-8"
            >
              Join SmartLogix
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-6"
            >
              {/* First Name and Last Name Inputs */}
              <div className="flex space-x-4">
                <div className="relative w-1/2">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-3 pl-10 border border-neutral-300 rounded-custom text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    />
                  </svg>
                </div>
                <div className="relative w-1/2">
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-3 pl-10 border border-neutral-300 rounded-custom text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    />
                  </svg>
                </div>
              </div>

              {/* Email Input */}
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={emailAddress}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-10 border border-neutral-300 rounded-custom text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 border border-neutral-300 rounded-custom text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 2c-1.104 0-2 .896-2 2v3h4v-3c0-1.104-.896-2-2-2zm9-5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h2V5a3 3 0 013-3h4a3 3 0 013 3v1h2a2 2 0 012 2z"
                  />
                </svg>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Create Account Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateAccount}
                className="w-full bg-primary-500 text-white py-3 rounded-custom font-semibold hover:bg-primary-600 transition-colors"
              >
                Create Account
              </motion.button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300"></div>
                </div>
                <div className="relative bg-neutral-50 px-4 text-neutral-600 text-sm">
                  OR
                </div>
              </div>

              {/* Google Sign Up */}
              <GoogleLogin />

              {/* Sign In Link */}
              <div className="text-center">
                <Link
                  to="/"
                  className="text-secondary-500 hover:text-secondary-600 hover:underline transition-colors"
                >
                  Already have an account? Sign In
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>

      <ToastContainer />
    </div>
  );
};

export default CreateAccount;
