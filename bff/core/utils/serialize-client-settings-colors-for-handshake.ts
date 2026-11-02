import { ColorRole } from "@matreshka/protocol/enums/color-role";
import { ColorToken } from "@matreshka/protocol/types/color-token";
import type { ClientSettingsColors } from "../types/client-settings";
import { resolvePartialColorsToIds } from "./color-roles-to-ids";
import { colorTokenId } from "./color-token-id";

export type HandshakeClientSettingsColors = {
  registry: Record<string, ColorToken>;
  default: Partial<Record<ColorRole, string>>;
};

export function serializeClientSettingsColorsForHandshake(
  colors: ClientSettingsColors,
): HandshakeClientSettingsColors {
  const registry = colors.registry.reduce(
    (acc, token) => {
      acc[colorTokenId(token)] = token;
      return acc;
    },
    {} as Record<string, ColorToken>,
  );

  return {
    registry,
    default: resolvePartialColorsToIds(colors.default),
  };
}
