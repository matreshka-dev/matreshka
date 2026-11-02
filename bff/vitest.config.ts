import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@matreshka/client-bff-protocol": path.resolve(
        __dirname,
        "../protocols/client-bff-protocol",
      ),
      "@matreshka/gateway-bff-protocol": path.resolve(
        __dirname,
        "../protocols/gateway-bff-protocol",
      ),
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
      "../protocols/client-bff-protocol/messages/platform-webauthn-messages.spec.ts",
      "../shared/utils/**/*.spec.ts",
    ],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
    },
  },
});
