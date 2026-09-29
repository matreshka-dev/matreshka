import { ConditionType } from "@matreshka/shared/enums/condition-type";
import type { Condition as SerializedCondition } from "@matreshka/shared/types/condition";

/**
 * Абстрактный класс, представляющий условие с типом и дополнительными данными.
 *
 * Используется для описания условий, которые могут быть сериализованы в JSON-формате и
 * применяться к компонентам или другим сущностям.
 *
 * @internal Используйте фабрики ({@link when}, {@link device} и др.).
 */
export abstract class Condition {
  /**
   * Создает экземпляр условия.
   *
   * @param type Тип условия.
   * @param payload Дополнительные данные, связанные с условием.
   */
  constructor(
    private type: ConditionType,
    private payload: object = {},
  ) {}

  /**
   * Сериализует условие в объект JSON-формата.
   *
   * @returns Объект с полями type и payload.
   */
  toJSON(): SerializedCondition {
    return {
      type: this.type,
      payload: this.payload,
    } as SerializedCondition;
  }
}
