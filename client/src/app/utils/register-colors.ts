import { ColorRole } from '@shared/enums/color-role';
import { ColorToken } from '@shared/types/color-token';
import {
  COLOR_TOKEN_STATES,
  resolveColorTokenTransitions,
  type ColorTokenState,
} from '@shared/utils/resolve-color-token-transitions';
import { serializeColorTokenMask } from '@shared/utils/serialize-color-token-mask';

let knownColors: Record<string, ColorToken> = {};
const knownColorRoles = new Set<string>();

const STATE_VAR_SUFFIX: Record<ColorTokenState, string> = {
  default: '',
  hover: '_hover',
  active: '_active',
};

export function registerColorRole(
  document: Document,
  paletteId: string,
  role: ColorRole,
) {
  const colorToken = knownColors[paletteId];
  if (!colorToken) {
    throw new Error(`Color token ${paletteId} not found`);
  }
  const classKey = paletteId + '-' + role;
  if (knownColorRoles.has(classKey)) {
    return;
  }
  knownColorRoles.add(classKey);

  const normalizedToken =
    'light' in colorToken && 'dark' in colorToken
      ? colorToken
      : {
          light: colorToken,
          dark: colorToken,
        };

  const resolvedTransitions = resolveColorTokenTransitions(
    colorToken.transition,
  );

  const style = document.createElement('style');

  const cssVars = (mode: 'light' | 'dark') => {
    const vars: Record<string, string | undefined> = {
      [`--${role}-color`]: normalizedToken[mode].default,
      [`--${role}-color_hover`]:
        normalizedToken[mode].hover ?? normalizedToken[mode].default,
      [`--${role}-color_active`]:
        normalizedToken[mode].active ?? normalizedToken[mode].default,
    };
    for (const state of COLOR_TOKEN_STATES) {
      const resolved = resolvedTransitions[state];
      if (!resolved) {
        continue;
      }
      const suffix = STATE_VAR_SUFFIX[state];
      vars[`--${role}-color-transition-duration${suffix}`] =
        `${resolved.duration}ms`;
      vars[`--${role}-color-transition-timing-function${suffix}`] =
        resolved.timingFunction;
    }
    if (colorToken.mask) {
      vars[`--${role}-color-mask-image`] = serializeColorTokenMask(
        colorToken.mask,
      );
    }
    return Object.entries(vars)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');
  };

  const rule = (selector: string, mode: 'light' | 'dark') =>
    `${selector} {\n${cssVars(mode)}\n}`;

  const classSelector = `.color-token-${classKey}`;
  const parts = [
    rule(classSelector, 'light'),
    `@media (prefers-color-scheme: dark) {\n${rule(classSelector, 'dark')}\n}`,
    rule(`html[data-color-scheme="dark"] ${classSelector}`, 'dark'),
    rule(`html[data-color-scheme="light"] ${classSelector}`, 'light'),
  ];
  style.innerHTML = parts.join('\n');
  // Важно указывать зависимость конкретных цветов от тонов каждый раз при установке новой палитры, иначе будет браться из основной палитры
  document.getElementsByTagName('head')[0].appendChild(style);
}

export function registerColors(palette: Record<string, ColorToken>) {
  knownColors = palette;
}
