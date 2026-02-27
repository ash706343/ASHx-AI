import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Dev server (local only)
  server: {
    proxy: {
      "/ask": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },

  // Preview server (used by Render)
  preview: {
    host: true,
    port: process.env.PORT || 4173,
    allowedHosts: ["ashx-ai-low1.onrender.com", ".onrender.com"], // ✅ IMPORTANT for Render
  },
});
