import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js dominates the bundle. Split it so the HTML, CSS and copy
    // paint immediately while the WebGL chunk streams in behind them.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/three/")) return "three";
          if (id.includes("/react") || id.includes("/scheduler/")) return "react";
          if (id.includes("/lenis/")) return "lenis";
          return "vendor";
        },
      },
    },
  },
});