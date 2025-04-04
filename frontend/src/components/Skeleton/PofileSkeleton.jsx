import React from "react";
import { motion } from "framer-motion";

const ProfileSkeleton = () => {
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
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6">
      {/* Tabs Navigation Skeleton */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row border-b border-neutral-200">
          <div className="flex-1 py-3 px-4 h-12 bg-gray-200 animate-pulse" />
          <div className="flex-1 py-3 px-4 h-12 bg-gray-200 animate-pulse" />
        </div>
      </div>

      {/* Tab Content Skeleton */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto"
      >
        <div>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {[1, 2].map((_, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-neutral-50 rounded-xl shadow-custom-light p-4 sm:p-6 border-l-4 border-secondary-500"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <div className="h-6 w-32 sm:w-40 bg-gray-300 rounded animate-pulse" />
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <div className="h-6 w-full sm:w-24 bg-gray-300 rounded-full animate-pulse" />
                    <div className="h-8 w-full sm:w-20 bg-gray-300 rounded-custom animate-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-gray-300 rounded animate-pulse" />
                  </div>
                  <div>
                    <div className="h-5 w-24 bg-gray-300 rounded animate-pulse mb-2" />
                    <div className="bg-neutral-200 p-3 rounded-lg space-y-2">
                      <div className="h-4 w-full bg-gray-300 rounded animate-pulse" />
                      <div className="h-4 w-5/6 bg-gray-300 rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default ProfileSkeleton;
