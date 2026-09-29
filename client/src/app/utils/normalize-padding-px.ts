import type { PaddingPx } from '@shared/types/padding-px';

export type PaddingPxResult = {
  top: number;
  bottom: number;
  start: number;
  end: number;
};

/**
 * Разворачивает padding из конфига в значения по сторонам (логические px).
 * Если вход `undefined`, все стороны — 0; отсутствующие ключи в объектах тоже считаются 0.
 */
export function normalizePaddingPx(value: PaddingPx): PaddingPxResult {
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

  const hasSides =
    'top' in value || 'bottom' in value || 'start' in value || 'end' in value;
  const hasAxis = 'vertical' in value || 'horizontal' in value;

  if (hasAxis && !hasSides) {
    const o = value;
    const vv = o.vertical !== undefined ? o.vertical : d;
    const hv = o.horizontal !== undefined ? o.horizontal : d;
    return { top: vv, bottom: vv, start: hv, end: hv };
  }

  if (hasSides) {
    const o = value;
    return {
      top: o.top !== undefined ? o.top : d,
      bottom: o.bottom !== undefined ? o.bottom : d,
      start: o.start !== undefined ? o.start : d,
      end: o.end !== undefined ? o.end : d,
    };
  }

  return { top: d, bottom: d, start: d, end: d };
}
