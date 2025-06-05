import React from "react";
import { motion } from "framer-motion";
import TypewriterText from "./TypewriterText";

const FeatureCard = ({
  icon = "🚀",
  title = "Feature Title",
  desc = "Feature description goes here",
  gradient = "from-blue-500/20 to-cyan-500/20",
  iconBg = "bg-blue-500/10",
  iconColor = "text-blue-400",
  index = 0,
  animationDelay = 0,
  titleDelay = 0,
  descDelay = 0,
  enableTypewriter = true,
  className = "",
  style = {},
}) => {
  const feature = { icon, title, desc, gradient, iconBg, iconColor };

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-custom border border-white/[0.08] bg-gradient-to-r ${feature.gradient} backdrop-blur-xl h-16 w-full max-w-xs sm:max-w-sm md:max-w-md ${className}`}
      style={style}
      initial={{ opacity: 0, x: -50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        delay: animationDelay + index * 0.2,
        duration: 0.6,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 },
      }}
    >
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative h-full flex items-center px-3 sm:px-4 gap-3 sm:gap-4">
        {/* Icon */}
        <motion.div
          className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 ${feature.iconBg} rounded-full flex items-center justify-center backdrop-blur-sm border border-white/[0.05]`}
          whileHover={{
            rotate: [0, -5, 5, 0],
            scale: 1.1,
          }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-lg filter drop-shadow-sm">{feature.icon}</span>
        </motion.div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
          <h3 className="text-white font-medium text-sm sm:text-base leading-none truncate mb-1 text-left">
            {enableTypewriter ? (
              <TypewriterText
                text={feature.title}
                delay={titleDelay + index * 300}
                speed={60}
              />
            ) : (
              feature.title
            )}
          </h3>
          <p className="text-white/60 text-xs sm:text-sm leading-none truncate text-left">
            {enableTypewriter ? (
              <TypewriterText
                text={feature.desc}
                delay={descDelay + index * 300}
                speed={30}
              />
            ) : (
              feature.desc
            )}
          </p>
        </div>

        {/* Side glow bar */}
        <motion.div
          className={`absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b ${feature.gradient} opacity-30`}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{
            delay: animationDelay + 0.5 + index * 0.2,
            duration: 0.8,
          }}
        />
      </div>
    </motion.div>
  );
};

export default FeatureCard;
