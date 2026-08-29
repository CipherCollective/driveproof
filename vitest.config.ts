import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@driveproof/types": resolve(__dirname, "shared/types/src/index.ts"),
      "@driveproof/fixtures": resolve(__dirname, "shared/fixtures/src/index.ts"),
      "@driveproof/driveproof-client": resolve(__dirname, "shared/driveproof-client/src/index.ts"),
      "@driveproof/midnight-wallet": resolve(__dirname, "shared/midnight-wallet/src/index.ts"),
      "@driveproof/midnight-runtime/proof-server": resolve(__dirname, "shared/midnight-runtime/src/proof-server.ts"),
      "@driveproof/midnight-runtime": resolve(__dirname, "shared/midnight-runtime/src/index.ts")
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["apps/**/*.test.{ts,tsx}", "shared/**/*.test.ts"]
  }
});
