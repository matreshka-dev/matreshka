/**
 * Преобразует цвет в шестнадцатеричном формате (`#RRGGBB`) в формат HSL.
 *
 * Использует стандартный алгоритм преобразования RGB в HSL.
 * Возвращает объект с числовыми значениями оттенка (h), насыщенности (s) и яркости (l).
 *
 * @param hex Цвет в шестнадцатеричном формате (например, "#ffcc00").
 * @returns Объект с компонентами HSL: { h, s, l }.
 */
export function HexToHSL(hex: `#${string}`) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  s = s * 100;
  s = Math.round(s);
  l = l * 100;
  l = Math.round(l);
  h = Math.round(360 * h);

  return {
    h,
    s,
    l,
  };
}
