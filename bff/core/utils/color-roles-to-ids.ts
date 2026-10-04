import { ColorRole } from "@matreshka/shared/enums/color-role";
import { ColorToken } from "@matreshka/shared/types/color-token";
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
