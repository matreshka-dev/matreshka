import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

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
}
