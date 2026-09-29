import { ReliableTargetedClientToBffMessage } from "../reliable-client-to-bff-message";

export type ClientContextInitPayload = Record<string, unknown>;

export class ContextInitMessage extends ReliableTargetedClientToBffMessage<ClientContextInitPayload> {
  static readonly type = "context-init";
  constructor(
    target: string,
    override readonly payload: ClientContextInitPayload = {},
  ) {
    super(target, payload);
  }
}
