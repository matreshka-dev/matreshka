import { ReliableTargetedMessageData } from "../../reliable-message";
import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

export type ComponentInteractionMessageData = ReliableTargetedMessageData & {
  /** Индексы элементов `interactions[eventType][]`, прошедших conditions на клиенте. */
  handlers: number[];
};

/**
 * Базовый класс сообщений клиента к BFF, относящихся к взаимодействию с компонентом
 * (совпадает по смыслу с ключами `interactions` / `emitInteraction` на сервере).
 */
export abstract class ComponentInteractionMessage<
  PAYLOAD = unknown,
> extends PingableTargetedClientToBffMessage<PAYLOAD> {
  /**
   * Тип события взаимодействия (например show, click, center-change).
   */
  abstract readonly eventType: string;

  private handlers: number[] = [];

  /**
   * Индексы server-handlers в `interactions[eventType][]`, которые клиент включил в снимок.
   */
  getHandlers(): number[] {
    return this.handlers;
  }

  setHandlers(handlers: number[]): this {
    this.handlers = handlers;
    return this;
  }

  override toJSON(): ComponentInteractionMessageData {
    return {
      ...super.toJSON(),
      handlers: this.handlers,
    };
  }
}

export function parseHandlers(value: unknown): number[] {
  if (value === undefined) {
    return [];
  }
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) => typeof item === "number" && Number.isInteger(item) && item >= 0,
    )
  ) {
    throw new Error("handlers must be an array of non-negative integers");
  }
  return value;
}
