import type { ServerComponentInteraction } from "./server-component-interaction";
export type DialogBackdropConfig = {
    onEnter?: ServerComponentInteraction[];
    onLeave?: ServerComponentInteraction[];
};
