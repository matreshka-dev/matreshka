import {
  AppFontsConfig,
  FontAsset,
  FontFaceStyle,
  type FontFaceToken,
  type FontStackToken,
} from '@shared/types/fonts';
import { rem } from './rem';
const FONT_FACE_STYLE_ELEMENT_SELECTOR = 'style[data-app-font-faces]';
const FONT_STYLESHEET_SELECTOR = 'link[data-app-font-stylesheet]';

export type FontStackCssProperties = {
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  lineHeight?: string;
};

function isFileAsset(
  asset: FontAsset | undefined,
): asset is Extract<FontAsset, { kind: 'file' }> {
  return asset?.kind === 'file';
}

function isStylesheetAsset(
  asset: FontAsset | undefined,
): asset is Extract<FontAsset, { kind: 'stylesheet' }> {
  return asset?.kind === 'stylesheet';
}

function resolveFontFamilies(
  ids: string[],
  fonts: AppFontsConfig,
  visiting = new Set<string>(),
): string[] {
  const families: string[] = [];

  for (const id of ids) {
    if (visiting.has(id)) {
      continue;
    }

    const stack = fonts.stacks.list[id];
    if (stack) {
      visiting.add(id);
      families.push(...resolveFontFamilies(stack.entries, fonts, visiting));
      visiting.delete(id);
      continue;
    }

    const face = fonts.faces[id];
    if (face) {
      families.push(face.family);
    }
  }

  return families;
}

function fontFaceCss(face: FontFaceToken): string | undefined {
  if (!isFileAsset(face.asset)) {
    return undefined;
  }

  const src = face.asset.format
    ? `url("${face.asset.url}") format("${face.asset.format}")`
    : `url("${face.asset.url}")`;

  return [
    '@font-face {',
    `  font-family: ${face.family};`,
    `  src: ${src};`,
    `  font-style: ${face.style ?? FontFaceStyle.Normal};`,
    `  font-weight: ${face.weight ?? 'normal'};`,
    '  font-display: swap;',
    '}',
  ].join('\n');
}

function ensureFontFaceStyleElement(document: Document): HTMLStyleElement {
  const existing = document.querySelector<HTMLStyleElement>(
    FONT_FACE_STYLE_ELEMENT_SELECTOR,
  );
  if (existing) {
    return existing;
  }

  const style = document.createElement('style');
  style.setAttribute('data-app-font-faces', 'true');
  document.head.appendChild(style);
  return style;
}

export function buildFontFamilyValue(
  stack: FontStackToken | undefined,
  fonts: AppFontsConfig,
): string | undefined {
  if (!stack) {
    return undefined;
  }

  const uniqueFamilies = new Set<string>();
  for (const family of resolveFontFamilies(stack.entries, fonts)) {
    uniqueFamilies.add(family);
  }

  if (!uniqueFamilies.size) {
    return undefined;
  }

  return Array.from(uniqueFamilies).join(', ');
}

export function buildFontStackCssProperties(
  stack: FontStackToken | undefined,
  fonts: AppFontsConfig,
): FontStackCssProperties {
  if (!stack) {
    return {};
  }

  return {
    fontFamily: buildFontFamilyValue(stack, fonts),
    fontWeight: stack.fontWeight == null ? undefined : String(stack.fontWeight),
    fontSize: rem(stack.fontSize),
    lineHeight: rem(stack.lineHeight),
  };
}

function syncBodyFontProperty(
  document: Document,
  property: string,
  value: string | undefined,
): void {
  if (value) {
    document.body.style.setProperty(property, value);
    return;
  }

  document.body.style.removeProperty(property);
}

export function applyFontsToDocument(
  document: Document,
  fonts: AppFontsConfig,
): void {
  const stylesheetUrls = new Set<string>();
  Object.values(fonts.faces).forEach((face) => {
    if (isStylesheetAsset(face.asset)) {
      stylesheetUrls.add(face.asset.url);
    }
  });

  const existingStylesheets = Array.from(
    document.querySelectorAll<HTMLLinkElement>(FONT_STYLESHEET_SELECTOR),
  ).map((link) => link.getAttribute('href'));

  stylesheetUrls.forEach((url) => {
    if (existingStylesheets.includes(url)) {
      return;
    }

    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', url);
    link.setAttribute('data-app-font-stylesheet', 'true');
    document.head.appendChild(link);
  });

  const fontFaceStyleElement = ensureFontFaceStyleElement(document);
  fontFaceStyleElement.textContent = Object.values(fonts.faces)
    .map((face) => fontFaceCss(face))
    .filter((css): css is string => typeof css === 'string')
    .join('\n\n');

  const appFontStyles = buildFontStackCssProperties(
    fonts.stacks.list[fonts.stacks.default],
    fonts,
  );
  syncBodyFontProperty(document, '--font-family', appFontStyles.fontFamily);
  syncBodyFontProperty(document, 'font-weight', appFontStyles.fontWeight);
  syncBodyFontProperty(document, 'font-size', appFontStyles.fontSize);
  syncBodyFontProperty(document, '--line-height', appFontStyles.lineHeight);
}
