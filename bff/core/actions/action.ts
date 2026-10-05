import type { Condition as SerializedCondition } from "@matreshka/shared/types/condition";
import { Condition } from "../conditions/condition";

export type ActionConditions = Condition[] | (() => Condition[]);

export type ActionConfig = {
  conditions?: ActionConditions;
};

/**
 * Абстрактный класс действия, которое может быть сериализовано для клиента.
 */
export abstract class Action {
  constructor(private readonly conditions?: ActionConditions) {}

  /**
   * Возвращает уникальный идентификатор класса действия.
   */
  abstract class(): string;

  /**
   * Возвращает полезную нагрузку действия.
   */
  abstract payload(): object;

  /**
   * Сериализует действие в объект с ключами `class` и `payload`.
   *
   * @returns Сериализованное представление действия.
   */
  toJSON() {
    const conditions = this.serializeConditions();
    const result: {
      class: string;
      payload: object;
      conditions?: SerializedCondition[];
    } = {
      class: this.class(),
      payload: this.payload(),
    };

    if (conditions.length > 0) {
      result.conditions = conditions;
    }

    return result;
  }

  private resolveConditions(): Condition[] {
    return typeof this.conditions === "function"
      ? this.conditions()
      : (this.conditions ?? []);
  }

  private serializeConditions(): SerializedCondition[] {
    return this.resolveConditions().map((condition) => condition.toJSON());
  }
}
