import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@matreshka/protocol": path.resolve(__dirname, "../protocol"),
      "@matreshka/shared": path.resolve(__dirname, "../shared"),
    },
  },
  test: {
    environment: "node",
    include: [
      "core/**/*.spec.ts",
      "components/**/*.spec.ts",
      "platforms/**/*.spec.ts",
      "webauthn/**/*.spec.ts",
      "../protocol/messages/platform-webauthn-messages.spec.ts",
      "../shared/utils/**/*.spec.ts",
    ],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
    },
  },
});
