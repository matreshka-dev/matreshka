import { describe, expect, it } from 'vitest';

import {
  computePopoverViewportClamp,
  computePopoverViewportMaxAvailable,
  type PopoverRect,
  type ViewportBounds,
} from './popover-viewport-clamp';

const viewport: ViewportBounds = {
  top: 0,
  left: 0,
  right: 400,
  bottom: 800,
};

function popover(
  top: number,
  left: number,
  width: number,
  height: number,
): PopoverRect {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

describe('computePopoverViewportMaxAvailable', () => {
  it('считает доступное место от top/left popover до краёв viewport', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({
      top: 100,
      left: 50,
      right: 250,
      bottom: 400,
      width: 200,
      height: 300,
      x: 50,
      y: 100,
      toJSON: () => ({}),
    });

    expect(computePopoverViewportMaxAvailable(el, viewport)).toEqual({
      maxHeight: 700,
      maxWidth: 250,
    });
  });
});

describe('computePopoverViewportClamp', () => {
  it('возвращает null, если popover полностью внутри viewport', () => {
    expect(
      computePopoverViewportClamp(popover(100, 50, 200, 300), viewport),
    ).toBeNull();
  });

  it('уменьшает maxHeight при переполнении снизу', () => {
    expect(
      computePopoverViewportClamp(popover(600, 50, 200, 300), viewport),
    ).toEqual({
      maxHeight: 200,
      maxWidth: 200,
    });
  });

  it('уменьшает maxWidth при переполнении справа', () => {
    expect(
      computePopoverViewportClamp(popover(100, 300, 200, 100), viewport),
    ).toEqual({
      maxHeight: 100,
      maxWidth: 100,
    });
  });

  it('учитывает переполнение с двух сторон по вертикали', () => {
    expect(
      computePopoverViewportClamp(popover(-50, 50, 200, 900), viewport),
    ).toEqual({
      maxHeight: 800,
      maxWidth: 200,
    });
  });

  it('учитывает переполнение слева и снизу', () => {
    expect(
      computePopoverViewportClamp(popover(700, -30, 200, 200), viewport),
    ).toEqual({
      maxHeight: 100,
      maxWidth: 170,
    });
  });
});
