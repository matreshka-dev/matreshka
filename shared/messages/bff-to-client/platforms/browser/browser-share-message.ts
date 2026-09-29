import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export type BrowserSharePayload = {
  url?: string;
  title?: string;
  text?: string;
};

export class BrowserShareMessage extends PingableBffToClientMessage<BrowserSharePayload> {
  static readonly type = "browser-share";
  constructor(public override readonly payload: BrowserSharePayload) {
    super(payload);
  }
}
