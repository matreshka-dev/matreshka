/**
 * Скругление углов в логических пикселях.
 *
 * `start` и `end` зависят от направления интерфейса, поэтому один конфиг
 * корректно отображается и в LTR, и в RTL без физических `left` / `right`.
 */
export type RadiusPxCorners = {
  topStart?: number;
  topEnd?: number;
  bottomStart?: number;
  bottomEnd?: number;
};

export type RadiusPxSides = {
  all?: number;
  top?: number;
  bottom?: number;
  start?: number;
  end?: number;
};

export type RadiusPx = number | (RadiusPxCorners & RadiusPxSides) | undefined;
