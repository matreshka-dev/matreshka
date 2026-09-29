import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export type BrowserOpenFilePayload = {
  url: string;
};

export class BrowserOpenFileMessage extends PingableBffToClientMessage<BrowserOpenFilePayload> {
  static readonly type = "browser-open-file";
  constructor(public override readonly payload: BrowserOpenFilePayload) {
    super(payload);
  }
}
