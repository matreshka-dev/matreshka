import type { ServerComponentInteraction } from "./server-component-interaction";

/** Сериализованные анимации подложки модального диалога (`::backdrop`). */
export type DialogBackdropConfig = {
  onEnter?: ServerComponentInteraction[];
  onLeave?: ServerComponentInteraction[];
};
