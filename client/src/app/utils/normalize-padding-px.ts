import type { PaddingPxWire } from '@shared/types/padding-px';

export type PaddingPxResult = {
  top: number;
  bottom: number;
  start: number;
  end: number;
};

/**
 * Разворачивает padding из конфига в значения по сторонам (логические px).
 * Если вход `undefined`, все стороны — 0; отсутствующие ключи в объектах тоже считаются 0.
 * `vertical` и `horizontal` задают fallback для пар сторон (top/bottom и start/end).
 * BFF задаёт `PaddingPx`; с wire возможны и другие комбинации (`PaddingPxWire`).
 */
export function normalizePaddingPx(value: PaddingPxWire): PaddingPxResult {
  const d = 0;

  if (value === undefined) {
    return {
      top: d,
      bottom: d,
      start: d,
      end: d,
    };
  }

  if (typeof value === 'number') {
    return { top: value, bottom: value, start: value, end: value };
  }

  const vv = value.vertical !== undefined ? value.vertical : d;
  const hv = value.horizontal !== undefined ? value.horizontal : d;

  return {
    top: value.top !== undefined ? value.top : vv,
    bottom: value.bottom !== undefined ? value.bottom : vv,
    start: value.start !== undefined ? value.start : hv,
    end: value.end !== undefined ? value.end : hv,
  };
}
