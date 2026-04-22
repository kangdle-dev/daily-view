import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.DOCKER_ENV
  ? "http://backend:3001"
  : "http://localhost:3001";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
