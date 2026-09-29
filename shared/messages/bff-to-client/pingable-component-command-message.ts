import { PingableTargetedBffToClientMessage } from "./pingable-bff-to-client-message";

/**
 * Сообщение BFF→клиент: лёгкая команда инстансу компонента, участвует в расчёте RTT.
 * В `target` передаётся тот же instance id, что и в поле `id` сериализованного компонента.
 */
export abstract class PingableComponentCommandMessage<
  PAYLOAD = unknown,
> extends PingableTargetedBffToClientMessage<PAYLOAD> {}
