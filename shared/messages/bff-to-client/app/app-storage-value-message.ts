import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";

export type AppStorageValuePayload = {
  key: string;
  value: string | undefined;
};

export class AppStorageValueMessage extends PingableBffToClientMessage<AppStorageValuePayload> {
  static readonly type = "storage-value";
  constructor(public override readonly payload: AppStorageValuePayload) {
    super(payload);
  }
}
