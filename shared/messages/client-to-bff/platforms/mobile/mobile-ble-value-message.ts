import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export type MobileBleValuePayload = { value: number };

export class MobileBleValueMessage extends PingableTargetedClientToBffMessage<MobileBleValuePayload> {
  static readonly type = "value";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileBleValuePayload,
  ) {
    super(target, payload);
  }
}
