import type { Condition } from "./condition";

/**
 * Элемент `interactions[event][]` в конфиге компонента (сериализация BFF → клиент).
 *
 * Поле `class` — идентификатор действия (`LocalAction` или `ServerAction`),
 * не путать с идентификатором виджета `ServerComponentClass`.
 */
export type ServerComponentInteraction = {
  class: string;
  payload: object;
  conditions?: Condition[];
};
