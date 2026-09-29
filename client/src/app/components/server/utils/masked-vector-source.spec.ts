import { describe, expect, it } from 'vitest';

import { RatioMode } from '@shared/enums/ratio-mode';

import {
  getVectorCssMask,
  getVectorMaskSize,
  getVectorSourceType,
} from './masked-vector-source';

describe('masked-vector-source', () => {
  it('определяет тип svg-источника', () => {
    expect(getVectorSourceType('<svg></svg>')).toBe('svg');
    expect(getVectorSourceType('https://example.com/icon.svg')).toBe('url');
    expect(getVectorSourceType('PHN2Zy8+')).toBe('base64');
  });

  it('возвращает mask-size по RatioMode', () => {
    expect(getVectorMaskSize(RatioMode.Fit)).toBe('contain');
    expect(getVectorMaskSize(RatioMode.Fill)).toBe('cover');
    expect(getVectorMaskSize(RatioMode.Stretch)).toBe('100% 100%');
    expect(getVectorMaskSize()).toBe('contain');
  });

  it('прокидывает mask-size в css mask', () => {
    const svg = '<svg></svg>';

    expect(getVectorCssMask(svg, RatioMode.Stretch)).toContain('/ 100% 100%');
    expect(getVectorCssMask(svg, RatioMode.Fill)).toContain('/ cover');
    expect(getVectorCssMask(svg, RatioMode.Fit)).toContain('/ contain');
  });
});
