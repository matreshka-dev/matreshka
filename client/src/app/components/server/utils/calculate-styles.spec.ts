import { describe, expect, it } from 'vitest';

import { DimensionalUnit } from '@shared/enums/dimensional-unit';
import {
  calculateGridItemStyles,
  calculateIconStyles,
  calculateSizeStyles,
} from './calculate-styles';

describe('calculateGridItemStyles', () => {
  it('возвращает CSS-свойства grid-line', () => {
    expect(
      calculateGridItemStyles({
        gridItem: {
          columnStart: 1,
          columnEnd: 3,
          rowStart: 'auto',
          rowEnd: { span: 2 },
        },
      }),
    ).toEqual({
      'grid-column-start': '1',
      'grid-column-end': '3',
      'grid-row-start': 'auto',
      'grid-row-end': 'span 2',
    });
  });

  it('возвращает пустой объект без gridItem', () => {
    expect(calculateGridItemStyles({})).toEqual({});
  });
});

describe('calculateIconStyles', () => {
  it('возвращает фиксированные width и height в rem', () => {
    expect(
      calculateIconStyles({
        size: 24,
      }),
    ).toEqual({
      width: '1.5rem',
      height: '1.5rem',
      'flex-shrink': '0',
    });
  });
});

describe('calculateSizeStyles', () => {
  it('возвращает пустой объект, если flexItem не задан', () => {
    expect(calculateSizeStyles({})).toEqual({});
  });

  it('трактует { grow } как flex-grow', () => {
    expect(calculateSizeStyles({ flexItem: { grow: 0.5 } })).toEqual({
      'flex-grow': 0.5,
    });
  });

  it('ставит фиксированный basis для { basis } в px', () => {
    expect(
      calculateSizeStyles({
        flexItem: { basis: { value: 200, unit: DimensionalUnit.Px } },
      }),
    ).toEqual({
      'flex-basis': '12.5rem',
      'flex-grow': '0',
      'flex-shrink': '0',
    });
  });

  it('сохраняет не-px единицу в basis', () => {
    expect(
      calculateSizeStyles({
        flexItem: { basis: { value: 50, unit: DimensionalUnit.Percent } },
      }),
    ).toEqual({
      'flex-basis': '50%',
      'flex-grow': '0',
      'flex-shrink': '0',
    });
  });

  it('трактует числовой basis > 1 как логические px', () => {
    expect(
      calculateSizeStyles({
        flexItem: { basis: 200 },
      }),
    ).toEqual({
      'flex-basis': '12.5rem',
      'flex-grow': '0',
      'flex-shrink': '0',
    });
  });

  it('прокидывает явные basis, grow и shrink', () => {
    expect(
      calculateSizeStyles({
        flexItem: {
          basis: { value: 100, unit: DimensionalUnit.Px },
          grow: 1,
          shrink: 0,
        },
      }),
    ).toEqual({
      'flex-basis': '6.25rem',
      'flex-grow': 1,
      'flex-shrink': 0,
    });
  });
});
