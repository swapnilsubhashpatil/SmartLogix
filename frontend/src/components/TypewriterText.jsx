import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const TypewriterText = ({ text, delay = 0, speed = 50 }) => {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      let i = 0;
      const typeWriter = () => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1));
          i++;
          setTimeout(typeWriter, speed);
        } else {
          // Hide cursor after typing is complete
          setTimeout(() => setShowCursor(false), 500);
        }
      };
      typeWriter();
    }, delay);

    return () => clearTimeout(timer);
  }, [text, delay, speed]);

  return (
    <span className="relative">
      {displayText}
      {showCursor && (
        <motion.span
          className="inline-block w-0.5 h-5 bg-blue-400 ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </span>
  );
};

export default TypewriterText;
