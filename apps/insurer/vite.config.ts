import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  define: { global: "globalThis" },
  plugins: [react(), wasm()],
  resolve: {
    alias: {
      buffer: "buffer",
      events: "events"
    }
  },
  build: { target: "esnext" },
  worker: { format: "es" },
  assetsInclude: ["**/*.wasm"],
  server: { port: 5174 }
});
