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
          allow-feedback="false"
          payload-text-visible="false"
        >
          <df-messenger-chat-bubble chat-title="SmartLogix Assistant"></df-messenger-chat-bubble>
        </df-messenger>
      )}
      <style>{`
        df-messenger {
          --df-messenger-font-family: 'Poppins', 'Inter', 'Segoe UI', 'Roboto', 'Arial', sans-serif;
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
          --df-messenger-border-radius: 24px;
          --df-messenger-chat-bubble-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --df-messenger-chat-bubble-font-color: #fff;
          --df-messenger-chat-bubble-border-radius: 24px;
          --df-messenger-min-width: 400px;
          --df-messenger-max-width: 440px;
          --df-messenger-box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          z-index: 999;
          position: fixed;
          bottom: 32px;
          right: 32px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          background: linear-gradient(145deg, #f8fafc, #ffffff) padding-box,
                      linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c) border-box;
        }

        df-messenger::part(drawer) {
          border-radius: 24px;
          background: linear-gradient(145deg, rgba(248, 250, 252, 0.95) 0%, rgba(240, 253, 244, 0.95) 30%, rgba(236, 253, 245, 0.95) 60%, rgba(240, 249, 255, 0.95) 100%);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
          transform-origin: bottom right;
          visibility: visible;
          border: 2px solid transparent;
          background: 
            linear-gradient(145deg, rgba(248, 250, 252, 0.95), rgba(255, 255, 255, 0.95)) padding-box,
            linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c) border-box;
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          color: #ffffff;
          font-family: 'Poppins', 'Inter', 'Segoe UI', sans-serif;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.5px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
          padding: 24px 20px;
          border-radius: 22px 22px 0 0;
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
          background: 
            linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%) padding-box,
            linear-gradient(45deg, #ffffff40, #ffffff20, #ffffff40) border-box;
          text-align: center;
        }

        df-messenger::part(chat-title)::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
          transform: translateX(-100%);
          animation: shimmer 3s infinite;
        }

        df-messenger::part(chat-title)::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #f093fb, #f5576c, #4facfe, #00f2fe);
          animation: gradient-flow 3s ease-in-out infinite;
        }

        df-messenger::part(send-button) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 8px 16px rgba(102, 126, 234, 0.3),
            0 4px 8px rgba(118, 75, 162, 0.2);
          border: 2px solid transparent;
          width: 48px;
          height: 48px;
          background: 
            linear-gradient(135deg, #667eea 0%, #764ba2 100%) padding-box,
            linear-gradient(45deg, #f093fb, #f5576c) border-box;
        }

        df-messenger::part(send-button):hover {
          background: 
            linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) padding-box,
            linear-gradient(45deg, #f093fb, #f5576c) border-box;
          transform: scale(1.1) rotate(5deg);
          box-shadow: 
            0 12px 24px rgba(102, 126, 234, 0.4),
            0 6px 12px rgba(118, 75, 162, 0.3);
        }

        df-messenger::part(input-box) {
          border: 2px solid transparent;
          border-radius: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 12px 20px;
          background: 
            rgba(255, 255, 255, 0.9) padding-box,
            linear-gradient(135deg, #667eea20, #764ba220, #f093fb20) border-box;
        }

        df-messenger::part(input-box):focus {
          background: 
            rgba(255, 255, 255, 0.95) padding-box,
            linear-gradient(135deg, #667eea, #764ba2, #f093fb) border-box;
          box-shadow: 
            0 0 0 4px rgba(102, 126, 234, 0.15),
            0 8px 16px rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }

        df-messenger::part(message-list) {
          background: linear-gradient(145deg, #f8fafc 0%, #f0fdf4 30%, #ecfdf5 60%, #f0f9ff 100%);
          padding: 16px;
        }

        df-messenger::part(message-bot) {
          background: rgba(255, 255, 255, 0.95);
          border-left: 4px solid #667eea;
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.08),
            0 4px 8px rgba(102, 126, 234, 0.1);
          border-radius: 20px 20px 20px 4px;
          margin: 12px 0;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          border: 1px solid transparent;
          background: 
            rgba(255, 255, 255, 0.95) padding-box,
            linear-gradient(135deg, #667eea20, #764ba220) border-box;
        }

        df-messenger::part(message-bot):hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 24px rgba(0, 0, 0, 0.12),
            0 6px 12px rgba(102, 126, 234, 0.15);
        }

        df-messenger::part(message-user) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          box-shadow: 
            0 8px 16px rgba(102, 126, 234, 0.25),
            0 4px 8px rgba(118, 75, 162, 0.2);
          border-radius: 20px 20px 4px 20px;
          margin: 12px 0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
          background: 
            linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%) padding-box,
            linear-gradient(45deg, #ffffff40, #ffffff20) border-box;
        }

        df-messenger::part(message-user):hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 24px rgba(102, 126, 234, 0.35),
            0 6px 12px rgba(118, 75, 162, 0.3);
        }

        df-messenger::part(chat-bubble) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          animation: float 3s ease-in-out infinite, pulse-glow 2s infinite;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 16px 32px rgba(102, 126, 234, 0.3),
            0 8px 16px rgba(118, 75, 162, 0.2);
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
          background: 
            linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%) padding-box,
            linear-gradient(45deg, #ffffff40, #ffffff20, #ffffff40) border-box;
        }

        df-messenger::part(chat-bubble):hover {
          transform: scale(1.05) rotate(1deg);
          box-shadow: 
            0 20px 40px rgba(102, 126, 234, 0.4),
            0 12px 24px rgba(118, 75, 162, 0.3);
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

        /* Hide payload messages */
        df-messenger::part(message-payload),
        df-messenger::part(payload-content) {
          display: none !important;
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
              0 16px 32px rgba(102, 126, 234, 0.3),
              0 8px 16px rgba(118, 75, 162, 0.2),
              0 0 0 0 rgba(102, 126, 234, 0.7);
          }
          50% {
            box-shadow: 
              0 16px 32px rgba(102, 126, 234, 0.3),
              0 8px 16px rgba(118, 75, 162, 0.2),
              0 0 0 12px rgba(102, 126, 234, 0);
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

        @keyframes gradient-flow {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @media (max-width: 500px) {
          df-messenger {
            --df-messenger-min-width: 90vw;
            --df-messenger-max-width: 95vw;
            right: 2.5vw;
            bottom: 2.5vw;
          }
        }

        /* Loading and error states */
        .chatbot-loading {
          position: fixed;
          bottom: 32px;
          right: 32px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 24px;
          padding: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 998;
          border: 2px solid transparent;
          background: 
            rgba(255, 255, 255, 0.95) padding-box,
            linear-gradient(135deg, #667eea20, #764ba220) border-box;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #667eea;
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
          border-radius: 24px;
          padding: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #1e293b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 998;
          border: 2px solid transparent;
          background: 
            rgba(255, 255, 255, 0.95) padding-box,
            linear-gradient(135deg, #667eea20, #764ba220) border-box;
        }

        .retry-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .retry-button:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          transform: scale(1.05);
        }
      `}</style>
    </>
  );
});

export default SmartLogixChatbot;
