// FeatureCarousel.jsx - Fixed version without overlapping
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FeatureCarousel = ({ features }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  const intervalRef = useRef(null);

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (!isPaused && features.length > 1) {
      intervalRef.current = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % features.length);
      }, 1700);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, features.length]);

  // Handle manual navigation
  const goToSlide = (index) => {
    if (index === currentIndex) return;

    const diff = index - currentIndex;
    const totalFeatures = features.length;

    // Determine shortest path (circular)
    let shortestDiff = diff;
    if (Math.abs(diff) > totalFeatures / 2) {
      shortestDiff = diff > 0 ? diff - totalFeatures : diff + totalFeatures;
    }

    setDirection(shortestDiff > 0 ? 1 : -1);
    setCurrentIndex(index);
  };

  // Get the visible cards with proper circular indexing
  const getVisibleCards = () => {
    if (isMobile) {
      return [{ index: currentIndex, position: "center" }];
    }

    const total = features.length;
    const prevIndex = (currentIndex - 1 + total) % total;
    const nextIndex = (currentIndex + 1) % total;

    return [
      { index: prevIndex, position: "left" },
      { index: currentIndex, position: "center" },
      { index: nextIndex, position: "right" },
    ];
  };

  const visibleCards = getVisibleCards();

  // Animation variants for smooth transitions
  const cardVariants = {
    left: {
      x: -160,
      scale: 0.85,
      opacity: 0.6,
      filter: "blur(2px)",
      zIndex: 10,
    },
    center: {
      x: 0,
      scale: 1.1,
      opacity: 1,
      filter: "blur(0px)",
      zIndex: 30,
    },
    right: {
      x: 160,
      scale: 0.85,
      opacity: 0.6,
      filter: "blur(2px)",
      zIndex: 10,
    },
    mobile: {
      x: 0,
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      zIndex: 30,
    },
  };

  const transition = {
    duration: 0.7,
    ease: [0.25, 0.46, 0.45, 0.94],
  };

  return (
    <div className="relative w-full max-w-6xl min-w-3xlmx-auto px-4">
      {/* Apple-style Glassmorphic Carousel Window */}
      <div
        className="relative bg-white/20 backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/30 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.4), 0 25px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        {/* Subtle inner glow */}
        <div
          className="absolute inset-0 rounded-3xl shadow-inner opacity-20 pointer-events-none"
          style={{ boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3)" }}
        />

        {/* Cards Container */}
        <div className="relative h-72 md:h-80 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence mode="sync">
              {visibleCards.map((card, index) => {
                const isCenter = card.position === "center";
                const feature = features[card.index];

                return (
                  <motion.div
                    key={`${card.index}-${card.position}-${currentIndex}`}
                    className={`absolute ${
                      isMobile ? "w-full max-w-sm" : "w-80"
                    }`}
                    initial={false}
                    animate={
                      isMobile
                        ? cardVariants.mobile
                        : cardVariants[card.position]
                    }
                    transition={transition}
                    whileHover={
                      isCenter
                        ? {
                            scale: isMobile ? 1.05 : 1.15,
                            y: -12,
                            transition: {
                              duration: 0.4,
                              ease: [0.25, 0.46, 0.45, 0.94],
                            },
                          }
                        : {}
                    }
                    style={{
                      pointerEvents: isCenter ? "auto" : "none",
                    }}
                  >
                    <div
                      className={`
                        h-64 md:h-72 rounded-2xl p-6 md:p-8
                        bg-white/80 backdrop-blur-xl border border-white/40
                        shadow-xl transition-all duration-500
                        ${feature.bgAccent}
                        ${
                          isCenter
                            ? "cursor-pointer hover:shadow-2xl hover:bg-white/90"
                            : ""
                        }
                      `}
                      style={{
                        background: isCenter
                          ? "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)"
                          : "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.6) 100%)",
                        boxShadow: isCenter
                          ? "0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.3)"
                          : "0 15px 30px -8px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.2)",
                      }}
                      onClick={() => isCenter && goToSlide(card.index)}
                    >
                      {/* Card Content */}
                      <div className="flex items-start gap-4 mb-6">
                        <motion.div
                          className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30"
                          whileHover={
                            isCenter
                              ? {
                                  scale: 1.1,
                                  rotate: 8,
                                  transition: { duration: 0.3 },
                                }
                              : {}
                          }
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                          }}
                        >
                          {feature.icon}
                        </motion.div>
                        <div className="flex-1">
                          <h3
                            className={`font-bold text-gray-900 mb-2 ${
                              isMobile
                                ? "text-xl"
                                : isCenter
                                ? "text-2xl"
                                : "text-lg"
                            }`}
                          >
                            {feature.title}
                          </h3>
                        </div>
                      </div>

                      <p
                        className={`text-gray-700 leading-relaxed ${
                          isMobile
                            ? "text-base"
                            : isCenter
                            ? "text-base"
                            : "text-sm"
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Apple-style Progress Indicators */}
        <div className="flex justify-center gap-2 mt-10">
          {features.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-700 ${
                index === currentIndex
                  ? "w-8 bg-gradient-to-r from-blue-500 to-emerald-500"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              style={{
                boxShadow:
                  index === currentIndex
                    ? "0 2px 8px rgba(59, 130, 246, 0.4)"
                    : "none",
              }}
            />
          ))}
        </div>

        {/* Navigation Arrows (Desktop Only) */}
        {!isMobile && features.length > 1 && (
          <>
            <motion.button
              onClick={() =>
                goToSlide(
                  (currentIndex - 1 + features.length) % features.length
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 z-40"
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </motion.button>

            <motion.button
              onClick={() => goToSlide((currentIndex + 1) % features.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 z-40"
              whileHover={{ scale: 1.1, x: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
};

export default FeatureCarousel;
