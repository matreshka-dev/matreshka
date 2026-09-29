import { ReliableTargetedBffToClientMessage } from "./reliable-bff-to-client-message";

/**
 * Сообщение BFF→клиент: команда инстансу компонента без расчёта RTT.
 * В `target` передаётся тот же instance id, что и в поле `id` сериализованного компонента.
 */
export abstract class ReliableComponentCommandMessage<
  PAYLOAD = unknown,
> extends ReliableTargetedBffToClientMessage<PAYLOAD> {}
