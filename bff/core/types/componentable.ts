import type { Condition as SerializedCondition } from "@matreshka/shared/types/condition";
import type { ServerComponentConfig } from "@matreshka/shared/types/server-component-config";

export type SerializedComponentRule<
  TOverrides extends Record<string, unknown> = Record<string, unknown>,
> = {
  conditions: SerializedCondition[];
  overrides: TOverrides;
};
/**
 * Интерфейс компонента, который может быть использован на клиенте.
 */
export interface Componentable {
  /**
   * Возвращает уникальный идентификатор компонента.
   */
  readonly id: string;

  /**
   * Сериализует компонент в объект, пригодный для передачи клиенту.
   *
   * @returns Объект с данными компонента: id, класс, состояние, условия, свойства и взаимодействия.
   */
  serialize(...args: unknown[]): ServerComponentConfig;
}
