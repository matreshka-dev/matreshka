import { ColorRole } from "@matreshka/shared/enums/color-role";
import { describe, expect, it } from "vitest";
import { serializeClientSettingsColorsForHandshake } from "./serialize-client-settings-colors-for-handshake";

const tokenA = {
  light: { default: "#111111" },
  dark: { default: "#eeeeee" },
};

const tokenB = {
  light: { default: "#222222" },
  dark: { default: "#dddddd" },
};

describe("serializeClientSettingsColorsForHandshake", () => {
  it("serializes registry and default role ids", () => {
    const result = serializeClientSettingsColorsForHandshake({
      registry: [tokenA, tokenB],
      default: {
        [ColorRole.Background]: tokenA,
        [ColorRole.Text]: tokenB,
      },
    });

    expect(Object.keys(result.registry)).toHaveLength(2);
    expect(result.default[ColorRole.Background]).toBeTruthy();
    expect(result.default[ColorRole.Text]).toBeTruthy();
  });
});
