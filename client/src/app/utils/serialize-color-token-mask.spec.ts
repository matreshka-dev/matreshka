import { ColorTokenMaskType } from '@shared/enums/color-token-mask-type';
import { serializeColorTokenLinearGradientMask } from '@shared/utils/serialize-color-token-linear-gradient-mask';
import { serializeColorTokenMask } from '@shared/utils/serialize-color-token-mask';
import { describe, expect, it } from 'vitest';

describe('serializeColorTokenLinearGradientMask', () => {
  it('мапит direction 180 и stops с at', () => {
    expect(
      serializeColorTokenLinearGradientMask({
        type: ColorTokenMaskType.LinearGradient,
        direction: 180,
        stops: [
          { color: 'black', at: 70 },
          { color: 'transparent', at: 100 },
        ],
      }),
    ).toBe('linear-gradient(180deg, black 70%, transparent 100%)');
  });

  it('мапит 50% / 75% fade', () => {
    expect(
      serializeColorTokenLinearGradientMask({
        type: ColorTokenMaskType.LinearGradient,
        direction: 180,
        stops: [
          { color: 'black', at: 50 },
          { color: 'transparent', at: 75 },
        ],
      }),
    ).toBe('linear-gradient(180deg, black 50%, transparent 75%)');
  });

  it('мапит 20% / 55% fade', () => {
    expect(
      serializeColorTokenLinearGradientMask({
        type: ColorTokenMaskType.LinearGradient,
        direction: 180,
        stops: [
          { color: 'black', at: 20 },
          { color: 'transparent', at: 55 },
        ],
      }),
    ).toBe('linear-gradient(180deg, black 20%, transparent 55%)');
  });

  it('мапит direction 0 (to top)', () => {
    expect(
      serializeColorTokenLinearGradientMask({
        type: ColorTokenMaskType.LinearGradient,
        direction: 0,
        stops: [
          { color: 'black', at: 0 },
          { color: 'transparent', at: 100 },
        ],
      }),
    ).toBe('linear-gradient(0deg, black 0%, transparent 100%)');
  });

  it('мапит shorthand без direction и без at', () => {
    expect(
      serializeColorTokenLinearGradientMask({
        type: ColorTokenMaskType.LinearGradient,
        stops: [
          { color: 'black' },
          { color: 'black' },
          { color: 'transparent' },
        ],
      }),
    ).toBe('linear-gradient(black, black, transparent)');
  });
});

describe('serializeColorTokenMask', () => {
  it('делегирует linearGradient', () => {
    expect(
      serializeColorTokenMask({
        type: ColorTokenMaskType.LinearGradient,
        direction: 180,
        stops: [
          { color: 'black', at: 70 },
          { color: 'transparent', at: 100 },
        ],
      }),
    ).toBe('linear-gradient(180deg, black 70%, transparent 100%)');
  });
});
