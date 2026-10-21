import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

/** Подтверждение выполнения platform-action на клиенте (без payload). */
export class PlatformActionCompletedMessage extends PingableTargetedClientToBffMessage<undefined> {
  static readonly type = "platform-action-completed";
  constructor(public override readonly target: string) {
    super(target);
  }
}
