import type { ComponentCommandActionPayload } from "./component-command-message";
import { PingableTargetedBffToClientMessage } from "./pingable-bff-to-client-message";

/**
 * Сообщение BFF→клиент: лёгкая команда инстансу компонента, участвует в расчёте RTT.
 * В `target` — instance id; в `payload.actionScope` — correlation ack (`component-action-<uuid>`).
 */
export abstract class PingableComponentCommandMessage<
  PAYLOAD extends ComponentCommandActionPayload = ComponentCommandActionPayload,
> extends PingableTargetedBffToClientMessage<PAYLOAD> {
  constructor(target: string, payload: PAYLOAD) {
    super(target, payload);
  }

  get actionScope(): string {
    return this.payload!.actionScope;
  }
}
