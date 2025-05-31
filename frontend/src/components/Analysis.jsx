import React from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";

const Analysis = () => {
  const { userId } = useParams();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analysis</h1>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8">
          <p className="text-gray-600 text-lg">User ID: {userId}</p>
          <p className="text-gray-500 mt-4">
            This is a placeholder for the Analysis page. Advanced analytics and
            insights will be added here.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Analysis;
