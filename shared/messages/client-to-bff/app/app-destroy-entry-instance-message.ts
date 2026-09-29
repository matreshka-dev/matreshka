import { PingableClientToBffMessage } from "../pingable-client-to-bff-message";

export type AppDestroyEntryInstancePayload = { id: string };

export class AppDestroyEntryInstanceMessage extends PingableClientToBffMessage<AppDestroyEntryInstancePayload> {
  static readonly type = "destroy-entry-instance";
  constructor(
    public override readonly payload: AppDestroyEntryInstancePayload,
  ) {
    super(payload);
  }
}
