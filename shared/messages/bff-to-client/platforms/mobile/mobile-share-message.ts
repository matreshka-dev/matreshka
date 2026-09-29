import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileSharePayload = {
  url?: string;
  title?: string;
  text?: string;
};

export class MobileShareMessage extends PingableBffToClientMessage<MobileSharePayload> {
  static readonly type = "mobile-share";
  constructor(public override readonly payload: MobileSharePayload) {
    super(payload);
  }
}
