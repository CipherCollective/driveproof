import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@driveproof/types": resolve(__dirname, "shared/types/src/index.ts"),
      "@driveproof/fixtures": resolve(__dirname, "shared/fixtures/src/index.ts"),
      "@driveproof/driveproof-client": resolve(__dirname, "shared/driveproof-client/src/index.ts")
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["apps/**/*.test.{ts,tsx}", "shared/**/*.test.ts"]
  }
});
