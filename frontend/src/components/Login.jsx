import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import GoogleLogin from "./GoogleLogin";
import Toast from "./Toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const [emailAddress, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [toastProps, setToastProps] = useState({ type: "", message: "" });

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setLoading(true);
      localStorage.setItem("token", token);
      setToastProps({ type: "success", message: "Google Login Successful!" });

      navigate("/dashboard");
    }
  }, [searchParams, navigate]);

  const handleLogin = async () => {
    if (!emailAddress || !password) {
      setToastProps({ type: "warn", message: "Please fill in all fields" });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/loginUser`, {
        emailAddress,
        password,
      });

      localStorage.setItem("token", response.data.token);
      // localStorage.setItem("userProfile", JSON.stringify(response.data.user));

      setToastProps({ type: "success", message: "Login Successful!" });

      setTimeout(() => {
        navigate("/dashboard");
        setLoading(false);
      }, 1000);
    } catch (error) {
      setToastProps({
        type: "error",
        message: `${error.response?.data?.message || "Login failed"}`,
      });
      // console.log(error.response?.data?.message);
      setLoading(false);
    }
  };
  const GlobeAnimation = () => {
    // Generate random positions for floating bubbles
    const bubbles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 100,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 3,
    }));

    // Route paths connecting major logistics hubs
    const routes = [
      "M80 100 Q150 60 220 100",
      "M100 80 Q170 120 240 90",
      "M90 120 Q160 80 230 110",
      "M70 90 Q140 140 210 95",
    ];

    return (
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <svg
          width="300"
          height="200"
          viewBox="0 0 300 200"
          className="text-white/30"
        >
          {/* Globe outline */}
          <motion.circle
            cx="150"
            cy="100"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3,2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Globe grid lines */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1, duration: 1 }}
          >
            {/* Horizontal grid lines */}
            <ellipse
              cx="150"
              cy="100"
              rx="80"
              ry="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <ellipse
              cx="150"
              cy="100"
              rx="80"
              ry="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <ellipse
              cx="150"
              cy="100"
              rx="80"
              ry="60"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />

            {/* Vertical grid lines */}
            <ellipse
              cx="150"
              cy="100"
              rx="20"
              ry="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <ellipse
              cx="150"
              cy="100"
              rx="40"
              ry="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <ellipse
              cx="150"
              cy="100"
              rx="60"
              ry="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
          </motion.g>

          {/* Animated route connections */}
          {routes.map((route, index) => (
            <motion.path
              key={index}
              d={route}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4,3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: index * 0.5,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Floating logistics bubbles */}
          {bubbles.map((bubble) => (
            <motion.g key={bubble.id}>
              <motion.circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.size}
                fill="currentColor"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.8, 0.4, 0.8],
                  scale: [0, 1, 1.2, 1],
                  y: [bubble.y, bubble.y - 10, bubble.y + 5, bubble.y],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: bubble.delay,
                  ease: "easeInOut",
                }}
              />

              {/* Ripple effect around bubbles */}
              <motion.circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.size * 2}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0, 2, 3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: bubble.delay + 1,
                  ease: "easeOut",
                }}
              />
            </motion.g>
          ))}

          {/* Central logistics hub */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            <circle
              cx="150"
              cy="100"
              r="12"
              fill="currentColor"
              opacity="0.8"
            />
            <motion.circle
              cx="150"
              cy="100"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 0.2, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Hub connections */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <motion.line
                key={i}
                x1="150"
                y1="100"
                x2={150 + Math.cos((angle * Math.PI) / 180) * 25}
                y2={100 + Math.sin((angle * Math.PI) / 180) * 25}
                stroke="currentColor"
                strokeWidth="1"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.g>

          {/* Data flow particles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.circle
              key={`particle-${i}`}
              r="1.5"
              fill="currentColor"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                cx: [80, 220],
                cy: [100 + Math.sin(i) * 20, 100 + Math.cos(i) * 20],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "linear",
              }}
            />
          ))}

          {/* Floating info boxes */}
          <motion.g
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
          >
            <rect
              x="20"
              y="30"
              width="40"
              height="20"
              rx="3"
              fill="currentColor"
              opacity="0.3"
            />
            <text
              x="40"
              y="42"
              textAnchor="middle"
              className="text-xs fill-current opacity-80"
            >
              24/7
            </text>
          </motion.g>

          <motion.g
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 2.5, duration: 1 }}
          >
            <rect
              x="240"
              y="150"
              width="45"
              height="20"
              rx="3"
              fill="currentColor"
              opacity="0.3"
            />
            <text
              x="262"
              y="162"
              textAnchor="middle"
              className="text-xs fill-current opacity-80"
            >
              LIVE
            </text>
          </motion.g>
        </svg>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col lg:flex-row">
      {/* Left Side - Decorative Gradient */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-2/3 lg:h-[calc(100vh-40px)] lg:m-5 bg-gradient-to-br from-[#45474b] via-[#379777] to-[#c7a711] relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl backdrop-blur-sm"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10  ">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "30px 30px",
            }}
          ></div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${200 + i * 50}px`,
                height: `${200 + i * 50}px`,
                left: `${-100 + i * 30}px`,
                top: `${-100 + i * 40}px`,
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 w-full">
          {/* Brand Title */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
              Smart
              <motion.span
                className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(59,130,246,0.5)",
                    "0 0 20px rgba(16,185,129,0.8)",
                    "0 0 10px rgba(59,130,246,0.5)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Logix
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xl text-white/80 font-semibold tracking-wide"
            >
              AI-Powered Logistics Revolution
            </motion.p>
          </motion.div>

          {/* Feature Cards */}

          {/* Logistics Animation */}
          <div className="relative w-full h-48 mt-8">
            <GlobeAnimation />
          </div>
        </div>
      </motion.div>

      {/* Right Side - Login Form or Creative Loading */}
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
              className="mt-8 text-lg font-medium text-primary-600"
            >
              Connecting to SmartLogix...
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
              Welcome Back
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center text-neutral-600 mb-8"
            >
              Log in to SmartLogix
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-6"
            >
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
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542-7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                className="w-full bg-primary-500 text-white py-3 rounded-custom font-semibold hover:bg-primary-600 transition-colors"
              >
                Sign In
              </motion.button>

              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300"></div>
                </div>
                <div className="relative bg-neutral-50 px-4 text-neutral-600 text-sm">
                  OR
                </div>
              </div>

              <GoogleLogin />

              <div className="text-center">
                <Link
                  to="/createAccount"
                  className="text-secondary-500 hover:text-secondary-600 hover:underline transition-colors"
                >
                  Don’t have an account? Sign up
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
      <Toast type={toastProps.type} message={toastProps.message} />
    </div>
  );
};

export default Login;
