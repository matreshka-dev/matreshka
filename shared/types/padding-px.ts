/**
 * Внутренние отступы в логических пикселях (числа с сервера).
 * На клиенте переводятся в rem; safe area выбранных сторон добавляется отдельно.
 *
 * `vertical` задаёт fallback для `top` и `bottom`, `horizontal` — для `start` и `end`.
 * Явные стороны перекрывают значения осей, поэтому можно писать, например,
 * `{ horizontal: 16, bottom: 8 }` вместо трёх отдельных ключей.
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

export type PaddingPx = number | (PaddingPxSides & PaddingPxAxis) | undefined;
