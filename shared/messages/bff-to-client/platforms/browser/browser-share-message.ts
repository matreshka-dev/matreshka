import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type BrowserSharePayload = {
  url?: string;
  title?: string;
  text?: string;
};

export class BrowserShareMessage extends PingableTargetedBffToClientMessage<BrowserSharePayload> {
  static readonly type = "browser-share";
  constructor(
    public override readonly target: string,
    public override readonly payload: BrowserSharePayload,
  ) {
    super(target, payload);
  }
}
