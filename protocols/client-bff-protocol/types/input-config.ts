import type { ServerComponentConfig } from "./server-component-config";

/** Базовый конфиг полей ввода: идентификатор вижета — поле `class` (как у остальных server-компонентов). */
export type InputConfig = {
  properties: {
    ref: string;
  };
} & ServerComponentConfig;
