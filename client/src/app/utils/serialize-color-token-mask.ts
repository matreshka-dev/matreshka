import { ColorTokenMaskType } from '@matreshka/client-bff-protocol/enums/color-token-mask-type';
import type { ColorTokenMask } from '@matreshka/client-bff-protocol/types/color-token';
import { serializeColorTokenLinearGradientMask } from './serialize-color-token-linear-gradient-mask';

/**
 * Сериализует mask color token в значение для CSS `mask-image`.
 */
export function serializeColorTokenMask(mask: ColorTokenMask): string {
  switch (mask.type) {
    case ColorTokenMaskType.LinearGradient:
      return serializeColorTokenLinearGradientMask(mask);
    default:
      throw new Error(
        `Unsupported color token mask type: ${String((mask as ColorTokenMask).type)}`,
      );
  }
}
