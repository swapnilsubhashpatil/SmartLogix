import React from "react";
import { motion } from "framer-motion";

const RouteResultsSkeleton = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Filter Buttons Skeleton */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 justify-center max-w-3xl w-full">
        {[1, 2, 3, 4].map((_, index) => (
          <div
            key={index}
            className="h-10 w-28 sm:w-32 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>

      {/* Routes List Skeleton */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {[1, 2, 3].map((_, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row items-start justify-between gap-4"
          >
            {/* Route Info Skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Route Metrics and Buttons Skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {[1, 2, 3, 4].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 w-16 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
              <div className="flex gap-4 p-2 w-full sm:w-auto justify-start sm:justify-end">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default RouteResultsSkeleton;
