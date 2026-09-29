import type { RadiusPx } from '@shared/types/radius-px';

export type RadiusPxResult = {
  topStart: number | undefined;
  topEnd: number | undefined;
  bottomStart: number | undefined;
  bottomEnd: number | undefined;
};

/**
 * Разворачивает radius из конфига в логические углы.
 * CSS logical properties дальше сами сопоставляют start/end с LTR или RTL.
 */
export function normalizeRadiusPx(value: RadiusPx): RadiusPxResult {
  if (value === undefined) {
    return {
      topStart: undefined,
      topEnd: undefined,
      bottomStart: undefined,
      bottomEnd: undefined,
    };
  }

  if (typeof value === 'number') {
    return {
      topStart: value,
      topEnd: value,
      bottomStart: value,
      bottomEnd: value,
    };
  }

  return {
    topStart: value.topStart ?? value.top ?? value.start ?? value.all,
    topEnd: value.topEnd ?? value.top ?? value.end ?? value.all,
    bottomStart: value.bottomStart ?? value.bottom ?? value.start ?? value.all,
    bottomEnd: value.bottomEnd ?? value.bottom ?? value.end ?? value.all,
  };
}
