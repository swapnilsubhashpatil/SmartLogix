import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/index.css";
import App from "./App.jsx";
import ChatbotDrawer from "./components/ChatbotDrawer.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <ChatbotDrawer />
  </StrictMode>
);
