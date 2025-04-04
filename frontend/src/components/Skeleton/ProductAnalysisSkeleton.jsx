import React from "react";
import { motion } from "framer-motion";

const ProductAnalysisSkeleton = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 mt-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto mt-6"
      >
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
          {/* Analysis Result Skeleton */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="h-8 w-48 bg-gray-300 rounded animate-pulse mb-6"></div>
            </motion.div>

            {/* Product Details Skeleton */}
            <motion.div
              variants={itemVariants}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6"
            >
              <div className="h-6 w-40 bg-gray-300 rounded animate-pulse mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-32 h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="flex-1 h-4 bg-gray-300 rounded animate-pulse ml-2"></div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse ml-2"></div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Required Export Documents Skeleton */}
            <motion.div
              variants={itemVariants}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6"
            >
              <div className="h-6 w-48 bg-gray-300 rounded animate-pulse mb-4"></div>
              <div className="space-y-2 ml-6">
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="h-4 w-3/4 bg-gray-300 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </motion.div>

            {/* Recommendations Skeleton */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-teal-50 to-yellow-50 rounded-xl p-6 border border-teal-200 mb-6"
            >
              <div className="h-6 w-40 bg-gray-300 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </motion.div>

            {/* Send to Compliance Button Skeleton */}
            <motion.div variants={itemVariants}>
              <div className="h-12 w-full sm:w-64 bg-gray-300 rounded-lg animate-pulse"></div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductAnalysisSkeleton;
