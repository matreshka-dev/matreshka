import { ReliableTargetedBffToClientMessage } from "../reliable-bff-to-client-message";

type ContextInitMessagePayload = Record<string, unknown>;

export class ContextInitMessage extends ReliableTargetedBffToClientMessage<
  Record<string, unknown>
> {
  static readonly type = "context-init";
  constructor(
    target: string,
    public override readonly payload: ContextInitMessagePayload,
  ) {
    super(target, payload);
  }
}
