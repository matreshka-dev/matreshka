import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export class ContextDestroyMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "context-destroy";
  constructor(target: string) {
    super(target, undefined);
  }
}
