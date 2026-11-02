import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileSharePayload = {
  url?: string;
  title?: string;
  text?: string;
};

export class MobileShareMessage extends PingableTargetedBffToClientMessage<MobileSharePayload> {
  static readonly type = "mobile-share";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileSharePayload,
  ) {
    super(target, payload);
  }
}
