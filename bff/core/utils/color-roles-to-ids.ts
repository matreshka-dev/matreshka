import { ColorRole } from "@matreshka/protocol/enums/color-role";
import { ColorToken } from "@matreshka/protocol/types/color-token";
import { colorTokenId } from "./color-token-id";

export function resolvePartialColorsToIds(
  colors: Partial<Record<ColorRole, ColorToken>>,
): Partial<Record<ColorRole, string>> {
  return Object.entries(colors).reduce(
    (acc, [role, value]) => {
      acc[role as ColorRole] = colorTokenId(value);
      return acc;
    },
    {} as Partial<Record<ColorRole, string>>,
  );
}
