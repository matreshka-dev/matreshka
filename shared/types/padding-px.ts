/**
 * Внутренние отступы в логических пикселях (числа с сервера).
 * На клиенте переводятся в rem; safe area выбранных сторон добавляется отдельно.
 */
export type PaddingPxSides = {
  top?: number;
  bottom?: number;
  start?: number;
  end?: number;
};

export type PaddingPxAxis = {
  vertical?: number;
  horizontal?: number;
};

export type PaddingPx = PaddingPxSides | PaddingPxAxis | number | undefined;
