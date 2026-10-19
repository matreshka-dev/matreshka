/**
 * Внутренние отступы в логических пикселях (числа с сервера).
 * На клиенте переводятся в rem; safe area выбранных сторон добавляется отдельно.
 *
 * `horizontal` задаёт `start` и `end`; с ним нельзя указывать `start`/`end`.
 * `vertical` задаёт `top` и `bottom`; с ним нельзя указывать `top`/`bottom`.
 * Можно комбинировать оси с «чужими» сторонами, например `{ horizontal: 16, bottom: 8 }`.
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

/** Только явные стороны, без осей. */
type PaddingPxSidesOnly = PaddingPxSides & {
  vertical?: never;
  horizontal?: never;
};

/** `horizontal` без `vertical`: start/end из оси, top/bottom — явно. */
type PaddingPxWithHorizontal = {
  horizontal: number;
  vertical?: never;
  top?: number;
  bottom?: number;
  start?: never;
  end?: never;
};

/** `vertical` без `horizontal`: top/bottom из оси, start/end — явно. */
type PaddingPxWithVertical = {
  vertical: number;
  horizontal?: never;
  top?: never;
  bottom?: never;
  start?: number;
  end?: number;
};

/** Обе оси — без явных сторон. */
type PaddingPxWithBothAxes = {
  vertical: number;
  horizontal: number;
  top?: never;
  bottom?: never;
  start?: never;
  end?: never;
};

export type PaddingPxObject =
  | PaddingPxSidesOnly
  | PaddingPxWithHorizontal
  | PaddingPxWithVertical
  | PaddingPxWithBothAxes;

/** Строгий тип для BFF и конфигов Stack. */
export type PaddingPx = number | PaddingPxObject | undefined;

/**
 * Любая комбинация ключей с wire (клиент нормализует без проверки взаимоисключений).
 */
export type PaddingPxWireObject = PaddingPxSides & PaddingPxAxis;

export type PaddingPxWire = number | PaddingPxWireObject | undefined;
