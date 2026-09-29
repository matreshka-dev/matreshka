import type { ColorTokenLinearGradientMask } from "../types/color-token";

function formatStop(color: string, at?: number): string {
  return at === undefined ? color : `${color} ${at}%`;
}

/**
 * Сериализует linear-gradient mask в значение для CSS `mask-image`.
 */
export function serializeColorTokenLinearGradientMask(
  mask: ColorTokenLinearGradientMask,
): string {
  const stopParts = mask.stops.map((stop) => formatStop(stop.color, stop.at));
  const anglePart =
    mask.direction !== undefined ? `${mask.direction}deg` : undefined;
  const args = [anglePart, ...stopParts].filter(
    (part): part is string => part !== undefined,
  );
  return `linear-gradient(${args.join(", ")})`;
}
