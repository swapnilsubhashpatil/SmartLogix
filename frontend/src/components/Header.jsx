import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Global, css } from "@emotion/react";

const Header = ({ title = "SmartLogix", page = "dashboard" }) => {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative max-w-7xl mx-auto bg-gradient-to-r from-[var(--color-primary-500)] via-[var(--color-secondary-500)] to-[var(--color-tertiary-500)] text-[var(--color-neutral-50)] py-6 sm:py-10 rounded-b-3xl overflow-hidden w-full shadow-[var(--shadow-custom-medium)]"
    >
      {/* Animated SVG Background - Circuit Pattern */}
      <div className="absolute inset-0">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid Pattern */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="var(--color-neutral-50)"
                strokeWidth="0.5"
                strokeOpacity="0.1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Circuit Lines */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          >
            <path
              d="M100 50 L300 50 L300 100 L500 100 L500 150 L700 150"
              stroke="var(--color-neutral-50)"
              strokeWidth="2"
              strokeOpacity="0.1"
              fill="none"
            />
            <path
              d="M800 60 L1000 60 L1000 120 L1200 120"
              stroke="var(--color-primary-400)"
              strokeWidth="1.5"
              strokeOpacity="0.15"
              fill="none"
            />
            <path
              d="M200 140 L400 140 L400 80 L600 80 L600 40"
              stroke="var(--color-secondary-400)"
              strokeWidth="1"
              strokeOpacity="0.1"
              fill="none"
            />
          </motion.g>

          {/* Circuit Nodes */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, delay: 1, staggerChildren: 0.2 }}
          >
            <circle
              cx="300"
              cy="50"
              r="3"
              fill="var(--color-neutral-50)"
              fillOpacity="0.2"
            />
            <circle
              cx="500"
              cy="100"
              r="2"
              fill="var(--color-primary-400)"
              fillOpacity="0.3"
            />
            <circle
              cx="1000"
              cy="60"
              r="2.5"
              fill="var(--color-secondary-400)"
              fillOpacity="0.25"
            />
            <circle
              cx="400"
              cy="140"
              r="2"
              fill="var(--color-neutral-50)"
              fillOpacity="0.15"
            />
          </motion.g>
        </svg>
      </div>

      {/* Floating Geometric Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-4 right-20 w-3 h-3 bg-[var(--color-primary-400)]/20 rounded-full"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-8 left-32 w-2 h-2 bg-[var(--color-secondary-400)]/30 rotate-45"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-1/2 right-1/4 w-1 h-1 bg-[var(--color-neutral-50)]/40 rounded-full"
        />
      </div>

      {/* Main Content */}
      <div className="relative px-4 sm:px-6 flex items-center justify-between gap-3">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex items-center space-x-1 sm:space-x-2"
        >
          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-secondary-500)] rounded-2xl flex items-center justify-center shadow-[var(--shadow-custom-light)]"
          >
            {/* Logo Icon - Abstract S */}
            <div className="relative">
              <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--color-neutral-50)]"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
                  <path
                    d="M8 12l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-secondary-500)] rounded-2xl blur-lg opacity-30 -z-10" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="text-xl sm:text-3xl font-bold text-[var(--color-neutral-50)] tracking-tight"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {title}
          </motion.h1>

          {/* Subtle accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: 0.8,
              delay: 1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="hidden sm:block w-12 h-px bg-gradient-to-r from-[var(--color-primary-400)] to-transparent ml-4"
          />
        </motion.div>

        {/* Right side - Status indicator and Buttons */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.9,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex items-center space-x-2"
        >
          {/* Conditional Buttons Based on Page */}
          {page === "route-optimization" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => alert("How It Works clicked!")}
              className="border-none outline-none bg-[var(--color-secondary-500)] px-3 py-1.5 text-[var(--color-neutral-50)] text-xs font-bold rounded-[var(--radius-custom)] transition-all ease-in-out duration-200 shadow-[0_4px_0_0_var(--color-secondary-700)]"
            >
              How It Works
            </motion.button>
          )}
          {page === "compliance-check" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/inventory-management")}
              className="border-none outline-none bg-[var(--color-secondary-500)] px-3 py-1.5 text-[var(--color-neutral-50)] text-xs font-bold rounded-[var(--radius-custom)] transition-all ease-in-out duration-200 shadow-[0_4px_0_0_var(--color-secondary-700)]"
            >
              Inventory
            </motion.button>
          )}
          {page === "export" && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/inventory-management")}
                className="border-none outline-none bg-[var(--color-secondary-500)] px-3 py-1.5 text-[var(--color-neutral-50)] text-xs font-bold rounded-[var(--radius-custom)] transition-all ease-in-out duration-200 shadow-[0_4px_0_0_var(--color-secondary-700)]"
              >
                Inventory
              </motion.button>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom accent border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-neutral-50)]/20 to-transparent" />

      {/* Global Button Active Style */}
      <Global
        styles={css`
          button:active {
            transform: translateY(4px);
            box-shadow: 0px 0px 0px 0px transparent;
          }
        `}
      />
    </motion.header>
  );
};

export default Header;
