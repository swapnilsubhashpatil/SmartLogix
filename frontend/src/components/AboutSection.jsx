import React from "react";
import { motion } from "framer-motion";
import {
  FaRoute,
  FaCheckCircle,
  FaLightbulb,
  FaBox,
  FaLeaf,
} from "react-icons/fa";

const AboutSection = () => {
  return (
    <section id="about" className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
      {/* Top Separator */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent"></div>
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-blue-400/60 to-emerald-400/60"></div>

      {/* Translucent Background with Glass Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/40 via-blue-50/30 to-emerald-50/20 backdrop-blur-sm"></div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:24px_24px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Enhanced Visual Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative hidden lg:block"
          >
            {/* Enhanced Geometric Design */}
            <div className="relative w-full h-[500px]">
              {/* Background Gradient Circle with Glass Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 via-emerald-50/40 to-blue-50/30 rounded-full backdrop-blur-md border border-white/20"></div>

              {/* Secondary background circle */}
              <div className="absolute inset-8 bg-gradient-to-tr from-white/40 to-transparent rounded-full backdrop-blur-sm border border-white/10"></div>

              {/* Floating Elements with Glass Effect */}
              <motion.div
                animate={{
                  y: [0, -12, 0],
                  rotate: [0, 8, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-16 left-16 w-18 h-18 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center border border-blue-100/50"
              >
                <FaRoute className="text-blue-600 text-2xl" />
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 12, 0],
                  rotate: [0, -8, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute top-20 right-20 w-16 h-16 bg-white/80 backdrop-blur-md rounded-xl shadow-lg flex items-center justify-center border border-emerald-100/50"
              >
                <FaCheckCircle className="text-emerald-600 text-xl" />
              </motion.div>

              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 6, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }}
                className="absolute bottom-24 left-24 w-16 h-16 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-center border border-yellow-100/50"
              >
                <FaLightbulb className="text-yellow-500 text-xl" />
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 8, 0],
                  rotate: [0, -4, 0],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute bottom-32 right-16 w-14 h-14 bg-white/80 backdrop-blur-md rounded-xl shadow-md flex items-center justify-center border border-blue-100/50"
              >
                <FaBox className="text-blue-500 text-lg" />
              </motion.div>

              {/* Enhanced Central Element with Glass Effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-40 h-40 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl flex items-center justify-center border-2 border-gray-100/50"
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      SL
                    </div>
                    <div className="text-xs text-gray-500 font-medium tracking-wider">
                      SMARTLOGIX
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Content */}
          <div className="space-y-10 flex flex-col justify-center h-full">
            {/* Header */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="inline-block"
              >
                <span className="text-sm font-bold text-blue-600 uppercase tracking-wider bg-blue-50/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-100/50">
                  About Us
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1]"
              >
                Smart
                <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  logix
                </span>
              </motion.h2>
            </div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-xl text-gray-700 leading-relaxed font-medium">
                A cutting-edge logistics platform designed to streamline
                operations, reduce costs, and promote sustainability.
              </p>
            </motion.div>

            {/* Key Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 ">
                Key Features
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-blue-50/40 backdrop-blur-sm hover:shadow-md transition-all duration-300 border border-blue-100/30"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaCheckCircle className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Compliance Check
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Automated validation to ensure adherence to industry
                      regulations and standards
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 to-emerald-50/40 backdrop-blur-sm hover:shadow-md transition-all duration-300 border border-emerald-100/30"
                >
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaRoute className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Route Optimization
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Time, cost, and carbon-efficient path planning for smarter
                      deliveries
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-blue-50/40 backdrop-blur-sm hover:shadow-md transition-all duration-300 border border-blue-100/30"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaBox className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Inventory Management
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Centralized system to track and manage all inventory data
                      in real time
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 to-emerald-50/40 backdrop-blur-sm hover:shadow-md transition-all duration-300 border border-emerald-100/30"
                >
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaLeaf className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Sustainability
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Eco-friendly supply chain solutions for a greener future
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Separator */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent"></div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-emerald-400/60 to-blue-400/60"></div>

      {/* Corner Decorative Elements */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-blue-200 rounded-tl-lg"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-emerald-200 rounded-tr-lg"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-emerald-200 rounded-bl-lg"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-blue-200 rounded-br-lg"></div>
    </section>
  );
};

export default AboutSection;
