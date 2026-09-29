import {
  evaluateConditions,
  type EvaluatableCondition,
} from "@matreshka/shared";
import type { Condition as SerializedCondition } from "@matreshka/shared/types/condition";
import type { Client } from "../client";
import { Condition } from "../conditions/condition";

export type ActionConditions = Condition[] | (() => Condition[]);

export type ActionConfig = {
  conditions?: ActionConditions;
};

type ActionConditionRef = {
  value: () => unknown;
};

type EvaluateActionConditions = (
  conditions: readonly EvaluatableCondition<ActionConditionRef>[],
  options: {
    getContextValue: (ref: ActionConditionRef) => unknown;
    getDeviceType: () => ReturnType<Client["deviceType"]>;
  },
) => boolean;

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

  canExecute(client: Client): boolean {
    const conditions = this.resolveConditions().map((condition) =>
      condition.toJSON(),
    ) as EvaluatableCondition<ActionConditionRef>[];

    const evaluateActionConditions =
      evaluateConditions as unknown as EvaluateActionConditions;

    return evaluateActionConditions(conditions, {
      getContextValue: (ref) => ref.value(),
      getDeviceType: () => client.deviceType(),
    });
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
