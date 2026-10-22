import { PingableTargetedClientToBffMessage } from "./pingable-client-to-bff-message";

/** Подтверждение выполнения targeted action на клиенте (platform или component), без payload. */
export class ActionCompletedMessage extends PingableTargetedClientToBffMessage<undefined> {
  static readonly type = "action-completed";
  constructor(public override readonly target: string) {
    super(target);
  }
}
