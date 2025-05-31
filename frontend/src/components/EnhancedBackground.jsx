import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const AppleStyleSideBackground = ({ children }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for subtle parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Left side blob animation variants
  const leftBlobVariants = {
    animate: {
      x: [-10, 10, -5, -10],
      y: [0, -30, 20, 0],
      scale: [1, 1.2, 0.9, 1],
      rotate: [0, 45, -30, 0],
      transition: {
        duration: 25,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const rightBlobVariants = {
    animate: {
      x: [10, -5, 15, 10],
      y: [0, 25, -15, 0],
      scale: [1, 0.8, 1.1, 1],
      rotate: [0, -60, 45, 0],
      transition: {
        duration: 30,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  // Floating particles for sides
  const sideParticleVariants = {
    animate: {
      y: [0, -40, 0],
      x: [0, 15, 0],
      opacity: [0.2, 0.6, 0.2],
      scale: [0.8, 1.2, 0.8],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50/30" />

      {/* Left side decorative elements */}
      <div className="absolute left-0 top-0 h-full w-1/3 overflow-hidden">
        {/* Left gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/40 via-blue-50/20 to-transparent" />

        {/* Large left blob */}
        <motion.div
          variants={leftBlobVariants}
          animate="animate"
          className="absolute -left-32 top-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 via-emerald-100/20 to-blue-100/25 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
          }}
        />

        {/* Medium left blob */}
        <motion.div
          variants={leftBlobVariants}
          animate="animate"
          className="absolute -left-20 top-2/3 w-64 h-64 bg-gradient-to-br from-emerald-200/25 via-blue-100/15 to-emerald-100/20 rounded-full blur-2xl"
          style={{
            transform: `translate(${mousePosition.x * 0.015}px, ${
              mousePosition.y * 0.015
            }px)`,
            animationDelay: "5s",
          }}
        />

        {/* Left floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`left-particle-${i}`}
            variants={sideParticleVariants}
            animate="animate"
            className="absolute w-3 h-3 bg-gradient-to-br from-blue-400/40 to-emerald-400/30 rounded-full blur-sm"
            style={{
              left: `${20 + i * 8}%`,
              top: `${15 + i * 12}%`,
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}

        {/* Left geometric shapes */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute left-8 top-1/3 w-20 h-20 border border-blue-200/30 rounded-2xl backdrop-blur-sm"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${
              mousePosition.y * 0.01
            }px)`,
          }}
        />
      </div>

      {/* Right side decorative elements */}
      <div className="absolute right-0 top-0 h-full w-1/3 overflow-hidden">
        {/* Right gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-emerald-100/40 via-emerald-50/20 to-transparent" />

        {/* Large right blob */}
        <motion.div
          variants={rightBlobVariants}
          animate="animate"
          className="absolute -right-32 top-1/3 w-80 h-80 bg-gradient-to-bl from-emerald-200/35 via-blue-100/25 to-emerald-100/30 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * -0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
          }}
        />

        {/* Medium right blob */}
        <motion.div
          variants={rightBlobVariants}
          animate="animate"
          className="absolute -right-24 top-3/4 w-56 h-56 bg-gradient-to-bl from-blue-200/30 via-emerald-100/20 to-blue-100/25 rounded-full blur-2xl"
          style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${
              mousePosition.y * 0.015
            }px)`,
            animationDelay: "7s",
          }}
        />

        {/* Right floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`right-particle-${i}`}
            variants={sideParticleVariants}
            animate="animate"
            className="absolute w-4 h-4 bg-gradient-to-bl from-emerald-400/35 to-blue-400/25 rounded-full blur-sm"
            style={{
              right: `${15 + i * 10}%`,
              top: `${20 + i * 15}%`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}

        {/* Right geometric shapes */}
        <motion.div
          animate={{
            rotate: [0, -360],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute right-12 top-1/2 w-16 h-16 border border-emerald-200/35 rounded-full backdrop-blur-sm"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${
              mousePosition.y * 0.01
            }px)`,
          }}
        />

        <motion.div
          animate={{
            rotate: [0, 180, 360],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-20 top-1/4 w-12 h-12 bg-gradient-to-br from-emerald-200/20 to-blue-200/15 rounded-lg backdrop-blur-sm border border-white/20"
          style={{
            transform: `translate(${mousePosition.x * -0.008}px, ${
              mousePosition.y * 0.008
            }px)`,
          }}
        />
      </div>

      {/* Top corner accents */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50/50 to-transparent" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-50/40 to-transparent rounded-full blur-2xl" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-50/40 to-transparent rounded-full blur-2xl" />

      {/* Bottom corner accents */}
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-emerald-100/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-100/25 to-transparent rounded-full blur-3xl" />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99 102 241) 1px, transparent 0)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Content with frosted glass effect */}
      <div className="relative z-10 min-h-screen">
        <div className="absolute inset-4 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 pointer-events-none" />
        {children}
      </div>
    </div>
  );
};

export default AppleStyleSideBackground;
