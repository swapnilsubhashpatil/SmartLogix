import React, { useEffect, useState, useCallback } from "react";

const SmartLogixChatbot = React.memo(() => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadScript = useCallback(() => {
    if (window.customElements.get("df-messenger")) {
      setIsScriptLoaded(true);
      setIsLoading(false);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/df-messenger.js";
    script.async = true;
    script.onload = () => {
      window.customElements.whenDefined("df-messenger").then(() => {
        setIsScriptLoaded(true);
        setIsLoading(false);
      });
    };
    script.onerror = () => {
      setError("Failed to load SmartLogix Assistant. Please try again later.");
      setIsLoading(false);
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(loadScript, 100);
    return () => clearTimeout(timeoutId);
  }, [loadScript]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/themes/df-messenger-default.css"
      />
      {isLoading && (
        <div className="chatbot-loading">
          <div className="spinner"></div>
          <p>Loading SmartLogix Assistant...</p>
        </div>
      )}
      {error && (
        <div className="chatbot-error">
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              loadScript();
            }}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      )}
      {isScriptLoaded && !error && (
        <df-messenger
          project-id="smartlogix-462215"
          agent-id="7032bfd8-4e8c-45b8-9ef0-b888e4667f6f"
          language-code="en"
          max-query-length="-1"
        >
          <df-messenger-chat-bubble chat-title="SmartLogix Assistant"></df-messenger-chat-bubble>
        </df-messenger>
      )}
      <style>{`
        df-messenger {
          --df-messenger-font-family: 'Inter', 'Segoe UI', 'Roboto', 'Arial', sans-serif;
          --df-messenger-font-color: #1e293b;
          --df-messenger-chat-background: linear-gradient(145deg, #f8fafc 0%, #f0fdf4 30%, #ecfdf5 60%, #f0f9ff 100%);
          --df-messenger-message-user-background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #10b981 100%);
          --df-messenger-message-user-font-color: #fff;
          --df-messenger-message-bot-background: rgba(255, 255, 255, 0.95);
          --df-messenger-message-bot-font-color: #1e293b;
          --df-messenger-input-box-background: rgba(255, 255, 255, 0.9);
          --df-messenger-input-box-font-color: #1e293b;
          --df-messenger-send-icon: #06b6d4;
          --df-messenger-primary-color: #10b981;
          --df-messenger-border-radius: 40px; /* Increased for smoother curves */
          --df-messenger-chat-bubble-background: linear-gradient(135deg, #06b6d4 0%, #0891b2 25%, #10b981 50%, #059669 75%, #fbbf24 100%);
          --df-messenger-chat-bubble-font-color: #fff;
          --df-messenger-chat-bubble-border-radius: 40px 40px 12px 40px; /* Adjusted for consistency */
          --df-messenger-min-width: 400px;
          --df-messenger-max-width: 440px;
          --df-messenger-box-shadow: 
            0 32px 64px rgba(6, 182, 212, 0.15),
            0 16px 32px rgba(16, 185, 129, 0.1),
            0 8px 16px rgba(251, 191, 36, 0.08),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          z-index: 999;
          position: fixed;
          bottom: 32px;
          right: 32px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 40px; /* Increased for smoother curves */
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        df-messenger::part(drawer) {
          border-radius: 40px; /* Match increased curves */
          background: linear-gradient(145deg, rgba(248, 250, 252, 0.95) 0%, rgba(240, 253, 244, 0.95) 30%, rgba(236, 253, 245, 0.95) 60%, rgba(240, 249, 255, 0.95) 100%);
          box-shadow: 
            0 32px 64px rgba(6, 182, 212, 0.15),
            0 16px 32px rgba(16, 185, 129, 0.1),
            0 8px 16px rgba(251, 191, 36, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
          transform-origin: bottom right;
          visibility: visible;
        }

        df-messenger::part(drawer[open]) {
          transform: scale(1);
          opacity: 1;
        }

        df-messenger::part(drawer:not([open])) {
          transform: scale(0.95);
          opacity: 0;
          visibility: hidden;
        }

        df-messenger::part(chat-title) {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 25%, #10b981 50%, #059669 75%, #fbbf24 100%);
          color: #fff;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          padding: 20px;
          border-radius: 40px 40px 0 0; /* Match increased curves */
          position: relative;
          overflow: hidden;
        }

        df-messenger::part(chat-title)::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
          transform: translateX(-100%);
          animation: shimmer 3s infinite;
        }

        df-messenger::part(send-button) {
          background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%);
          border-radius: 50%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 8px 16px rgba(6, 182, 212, 0.3),
            0 4px 8px rgba(16, 185, 129, 0.2);
          border: none;
          width: 48px;
          height: 48px;
        }

        df-messenger::part(send-button):hover {
          background: linear-gradient(135deg, #0891b2 0%, #059669 100%);
          transform: scale(1.15) rotate(5deg);
          box-shadow: 
            0 12px 24px rgba(6, 182, 212, 0.4),
            0 6px 12px rgba(16, 185, 129, 0.3);
        }

        df-messenger::part(input-box) {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 32px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 
            0 4px 8px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          padding: 12px 20px;
        }

        df-messenger::part(input-box):focus {
          border-color: #06b6d4;
          box-shadow: 
            0 0 0 4px rgba(6, 182, 212, 0.15),
            0 8px 16px rgba(6, 182, 212, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        df-messenger::part(message-list) {
          background: linear-gradient(145deg, #f8fafc 0%, #f0fdf4 30%, #ecfdf5 60%, #f0f9ff 100%);
          padding: 16px;
        }

        df-messenger::part(message-bot) {
          background: rgba(255, 255, 255, 0.95);
          border-left: 4px solid #06b6d4;
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.08),
            0 4px 8px rgba(6, 182, 212, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          border-radius: 24px 24px 24px 8px;
          margin: 12px 0;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        df-messenger::part(message-bot):hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 24px rgba(0, 0, 0, 0.12),
            0 6px 12px rgba(6, 182, 212, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        df-messenger::part(message-user) {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #10b981 100%);
          box-shadow: 
            0 8px 16px rgba(251, 191, 36, 0.25),
            0 4px 8px rgba(16, 185, 129, 0.2);
          border-radius: 24px 24px 8px 24px;
          margin: 12px 0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        df-messenger::part(message-user):hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 24px rgba(251, 191, 36, 0.35),
            0 6px 12px rgba(16, 185, 129, 0.3);
        }

        df-messenger::part(message-user)::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255pubs,0.2) 50%, transparent 70%);
          transform: translateX(-100%);
          animation: shimmer 2s infinite;
        }

        df-messenger::part(chat-bubble) {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 25%, #10b981 50%, #059669 75%, #fbbf24 100%);
          animation: float 3s ease-in-out infinite, pulse-glow 2s infinite;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 16px 32px rgba(6, 182, 212, 0.3),
            0 8px 16px rgba(16, 185, 129, 0.2),
            0 4px 8px rgba(251, 191, 36, 0.15);
          border-radius: 40px 40px 12px 40px; /* Adjusted for consistency */
          position: relative;
          overflow: hidden;
        }

        df-messenger::part(chat-bubble):hover {
          transform: scale(1.1) rotate(2deg);
          box-shadow: 
            0 20px 40px rgba(6, 182, 212, 0.4),
            0 12px 24px rgba(16, 185, 129, 0.3),
            0 6px 12px rgba(251, 191, 36, 0.2);
        }

        df-messenger::part(chat-bubble)::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
          transform: translateX(-100%);
          animation: shimmer 4s infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 
              0 16px 32px rgba(6, 182, 212, 0.3),
              0 8px 16px rgba(16, 185, 129, 0.2),
              0 4px 8px rgba(251, 191, 36, 0.15),
              0 0 0 0 rgba(6, 182, 212, 0.7);
          }
          50% {
            box-shadow: 
              0 16px 32px rgba(6, 182, 212, 0.3),
              0 8px 16px rgba(16, 185, 129, 0.2),
              0 4px 8px rgba(251, 191, 36, 0.15),
              0 0 0 12px rgba(6, 182, 212, 0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @media (max-width: 500px) {
          df-messenger {
            --df-messenger-min-width: 90vw;
            --df-messenger-max-width: 95vw;
            right: 2.5vw;
            bottom: 2.5vw;
            --df-messenger-border-radius: 32px; /* Slightly larger for mobile */
            --df-messenger-chat-bubble-border-radius: 32px 32px 8px 32px;
          }
        }

        /* Enhanced glassmorphism container with curves and shadows */
        df-messenger::after {
          content: '';
          position: absolute;
          top: -4px; /* Slightly thicker border */
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: linear-gradient(
            45deg, 
            rgba(6, 182, 212, 0.15) 0%, 
            rgba(16, 185, 129, 0.15) 25%, 
            rgba(251, 191, 36, 0.15) 50%, 
            rgba(6, 182, 212, 0.15) 75%, 
            rgba(16, 185, 129, 0.15) 100%
          );
          border-radius: 44px; /* Increased for smoother curves */
          z-index: -1;
          box-shadow: 
            0 8px 24px rgba(6, 182, 212, 0.2),
            0 4px 16px rgba(16, 185, 129, 0.15),
            0 2px 8px rgba(251, 191, 36, 0.1),
            inset 0 0 4px rgba(255, 255, 255, 0.2); /* Inner glow for depth */
          animation: rotate-border 10s linear infinite; /* Slower for smoother effect */
        }

        @keyframes rotate-border {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 400% 50%; /* Smoother gradient rotation */
          }
        }

        /* Logistics icon enhancement */
        df-messenger::before {
          content: "🚚";
          position: absolute;
          top: -12px;
          left: -12px;
          background: linear-gradient(135deg, #fbbf24 0%, #10b981 100%);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          z-index: 1000;
          box-shadow: 
            0 8px 16px rgba(251, 191, 36, 0.3),
            0 4px 8px rgba(16, 185, 129, 0.2);
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
          60% {
            transform: translateY(-4px);
          }
        }

        /* Loading and error states */
        .chatbot-loading {
          position: fixed;
          bottom: 32px;
          right: 32px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 32px;
          padding: 16px;
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.08),
            0 4px 8px rgba(6, 182, 212, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 998;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #06b6d4;
          border-top: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .chatbot-error {
          position: fixed;
          bottom: 32px;
          right: 32px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 32px;
          padding: 16px;
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.08),
            0 4px 8px rgba(6, 182, 212, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #1e293b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 998;
        }

        .retry-button {
          background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%);
          color: #fff;
          border: none;
          border-radius: 24px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .retry-button:hover {
          background: linear-gradient(135deg, #0891b2 0%, #059669 100%);
          transform: scale(1.05);
        }
      `}</style>
    </>
  );
});

export default SmartLogixChatbot;
