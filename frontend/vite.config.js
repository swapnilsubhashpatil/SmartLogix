import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // Import tailwindcss

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], // Add tailwindcss() as a plugin
});
