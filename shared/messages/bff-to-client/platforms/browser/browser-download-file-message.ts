import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export type BrowserDownloadFilePayload = {
  url: string;
  filename: string;
};

export class BrowserDownloadFileMessage extends PingableBffToClientMessage<BrowserDownloadFilePayload> {
  static readonly type = "browser-download-file";
  constructor(public override readonly payload: BrowserDownloadFilePayload) {
    super(payload);
  }
}
