import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";

export type AppNavigatePayload = { path: string };

export class AppNavigateMessage extends PingableBffToClientMessage<AppNavigatePayload> {
  static readonly type = "navigate";
  constructor(public override readonly payload: AppNavigatePayload) {
    super(payload);
  }
}
