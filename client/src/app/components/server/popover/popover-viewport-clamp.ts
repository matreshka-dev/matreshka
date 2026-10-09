export type ViewportBounds = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export type PopoverRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

/** Лимиты габаритов popover в px; задаются inline как --popover-max-* на корне. */
export type PopoverViewportClamp = {
  maxHeight: number;
  maxWidth: number;
};

/** Границы видимой области (клавиатура, zoom); без visualViewport — layout viewport документа. */
export function getVisualViewportBounds(): ViewportBounds {
  const vv = typeof visualViewport !== 'undefined' ? visualViewport : null;
  if (vv) {
    return {
      top: vv.offsetTop,
      left: vv.offsetLeft,
      right: vv.offsetLeft + vv.width,
      bottom: vv.offsetTop + vv.height,
    };
  }

  const docEl = document.documentElement;
  return {
    top: 0,
    left: 0,
    right: docEl.clientWidth,
    bottom: docEl.clientHeight,
  };
}

/**
 * Потолок max-height/max-width от текущей позиции popover до краёв visual viewport.
 * Не зависит от scrollHeight и высоты контента — смена max-* не меняет rect.top/left (block-end),
 * поэтому нет петли с ResizeObserver и снятием переменных.
 * Отступ от краёв viewport = 0; зазоры — у потомков в BFF.
 */
export function computePopoverViewportMaxAvailable(
  el: HTMLElement,
  viewport: ViewportBounds,
  anchor?: HTMLElement | null,
): PopoverViewportClamp {
  const rect = el.getBoundingClientRect();
  let heightOriginTop = rect.top;
  const anchorRect = anchor?.getBoundingClientRect();
  // block-end: потолок от низа якоря, а не от rect.top (он может «ползти» при смене max-height).
  if (anchorRect && rect.top >= anchorRect.bottom - 1) {
    heightOriginTop = anchorRect.bottom;
  }

  const maxHeight = Math.max(0, viewport.bottom - heightOriginTop);
  const maxWidth = Math.max(
    0,
    Math.min(viewport.right - rect.left, rect.right - viewport.left),
  );
  return { maxHeight, maxWidth };
}

/**
 * @deprecated Оставлен для unit-тестов inset-логики; в runtime не используется.
 */
export function computePopoverViewportClamp(
  popover: PopoverRect,
  viewport: ViewportBounds,
): PopoverViewportClamp | null {
  const topInset = Math.max(0, viewport.top - popover.top);
  const bottomInset = Math.max(0, popover.bottom - viewport.bottom);
  const leftInset = Math.max(0, viewport.left - popover.left);
  const rightInset = Math.max(0, popover.right - viewport.right);

  if (
    topInset === 0 &&
    bottomInset === 0 &&
    leftInset === 0 &&
    rightInset === 0
  ) {
    return null;
  }

  return {
    maxHeight: Math.max(0, popover.height - topInset - bottomInset),
    maxWidth: Math.max(0, popover.width - leftInset - rightInset),
  };
}

/** Inline CSS-переменные для .native-popover--anchor-positioned; скролл — у потомков, не на корне. */
export function applyPopoverViewportClampStyles(
  el: HTMLElement,
  clamp: PopoverViewportClamp | null,
): void {
  if (!clamp) {
    el.style.removeProperty('--popover-max-height');
    el.style.removeProperty('--popover-max-width');
    return;
  }

  el.style.setProperty('--popover-max-height', `${clamp.maxHeight}px`);
  el.style.setProperty('--popover-max-width', `${clamp.maxWidth}px`);
}

export function popoverViewportClampKey(clamp: PopoverViewportClamp): string {
  return `${Math.round(clamp.maxHeight)},${Math.round(clamp.maxWidth)}`;
}
