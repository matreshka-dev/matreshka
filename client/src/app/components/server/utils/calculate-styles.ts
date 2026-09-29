import { DimensionalUnit } from '@shared/enums/dimensional-unit';
import type { DimensionalValue } from '@shared/types/dimensional-value';
import { isDimensionalValue, type FlexItemSpec } from '@shared/types/flex-item';
import type { GridItem, GridLine } from '@shared/types/grid-item';
import type { RadiusPx } from '@shared/types/radius-px';
import { rem } from '../../../utils/rem';

function gridLineToCss(value: GridLine): string {
  if (typeof value === 'number') {
    return String(value);
  }
  if (value === 'auto') {
    return 'auto';
  }
  return `span ${value.span}`;
}

/** Стили размещения grid-item; применяются на wrapper, когда компонент внутри grid. */
export function calculateGridItemStyles(opts: {
  gridItem?: GridItem;
}): Record<string, string> {
  const { gridItem } = opts;
  if (!gridItem) {
    return {};
  }

  const styles: Record<string, string> = {};
  if (gridItem.columnStart !== undefined) {
    styles['grid-column-start'] = gridLineToCss(gridItem.columnStart);
  }
  if (gridItem.columnEnd !== undefined) {
    styles['grid-column-end'] = gridLineToCss(gridItem.columnEnd);
  }
  if (gridItem.rowStart !== undefined) {
    styles['grid-row-start'] = gridLineToCss(gridItem.rowStart);
  }
  if (gridItem.rowEnd !== undefined) {
    styles['grid-row-end'] = gridLineToCss(gridItem.rowEnd);
  }
  return styles;
}

function hasDefiniteBasis(
  basis: number | DimensionalValue | undefined,
): basis is DimensionalValue | number {
  if (isDimensionalValue(basis)) {
    return true;
  }
  return typeof basis === 'number' && basis > 1;
}

function formatFlexBasis(value: number | DimensionalValue): string {
  if (typeof value === 'number') {
    if (value > 1) {
      return rem(value);
    }
    return 'auto';
  }
  if (value.unit === DimensionalUnit.Px) {
    return rem(value.value);
  }
  return `${value.value}${value.unit}`;
}

export function calculateSizeStyles(opts: {
  flexItem?: FlexItemSpec;
}): Record<string, string | number> {
  const flexItem = opts.flexItem;
  if (typeof flexItem === 'undefined') {
    return {};
  }
  const styles: Record<string, string | number> = {};
  const definiteBasis = hasDefiniteBasis(flexItem.basis);
  if (flexItem.basis !== undefined) {
    styles['flex-basis'] = formatFlexBasis(flexItem.basis);
  }
  if (flexItem.grow !== undefined) {
    styles['flex-grow'] = flexItem.grow;
  } else if (definiteBasis) {
    styles['flex-grow'] = '0';
  }
  if (flexItem.shrink !== undefined) {
    styles['flex-shrink'] = flexItem.shrink;
  } else if (definiteBasis) {
    styles['flex-shrink'] = '0';
  }
  return styles;
}

/**
 * Стили разделителя Line: толщина и скругление задаются в px на стороне BFF, в CSS — rem.
 */
export function calculateLineStyles(opts: {
  size?: number;
  radius?: RadiusPx;
}): Record<string, string> {
  const styles: Record<string, string> = {};
  if (typeof opts.size === 'number' && opts.size > 0) {
    styles['flex'] = `0 0 ${rem(opts.size)}`;
  }
  if (typeof opts.radius === 'number' && opts.radius > 0) {
    styles['border-radius'] = rem(opts.radius);
  }
  return styles;
}

export function calculateIconStyles(opts: {
  size: number;
}): Record<string, string> {
  return {
    width: rem(opts.size),
    height: rem(opts.size),
    'flex-shrink': '0',
  };
}

export function calculateScaleStyles(opts: {
  scale?: number;
}): Record<string, string | number> {
  const scale = opts.scale;
  if (typeof scale === 'undefined') {
    // Сбрасываем, чтобы дочерние компоненты не унаследовали значение родителя
    return {};
  }

  const value = scale;

  if (typeof value === 'undefined') {
    return {};
  }

  return {
    'font-size': value * 100 + '%',
  };
}

export function calculatePopoverWidth(opts: {
  size?: number;
}): string | undefined {
  const size = opts.size;
  if (typeof size === 'undefined') {
    return undefined;
  }

  const value = size;

  if (typeof value === 'undefined' || value <= 0) {
    return undefined;
  }

  if (value > 1) {
    return rem(value);
  }

  return `calc(anchor-size(width) * ${value})`;
}
