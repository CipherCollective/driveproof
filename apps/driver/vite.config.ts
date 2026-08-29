import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  define: { global: "globalThis" },
  plugins: [react(), wasm()],
  optimizeDeps: {
    include: ["level", "browser-level", "abstract-level", "level-supports", "level-transcoder"],
    esbuildOptions: { target: "esnext" }
  },
  build: { target: "esnext" },
  worker: { format: "es" },
  assetsInclude: ["**/*.wasm"],
  server: {
    port: 5173,
    fs: { allow: [".."] }
  }
});
