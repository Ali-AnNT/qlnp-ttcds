import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { iifeWrap } from "./vite-plugin-iife-wrap";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  envDir: "../../",
  server: {
    host: "::",
    port: 5100,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), iifeWrap()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        // Fixed output names instead of content-hashed
        entryFileNames: "qlnp.js",
        chunkFileNames: "qlnp-[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) return "qlnp.css";
          return "qlnp-[name][extname]";
        },
      },
    },
  },
}));