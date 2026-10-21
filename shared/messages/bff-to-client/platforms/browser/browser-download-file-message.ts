import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type BrowserDownloadFilePayload = {
  url: string;
  filename: string;
};

export class BrowserDownloadFileMessage extends PingableTargetedBffToClientMessage<BrowserDownloadFilePayload> {
  static readonly type = "browser-download-file";
  constructor(
    public override readonly target: string,
    public override readonly payload: BrowserDownloadFilePayload,
  ) {
    super(target, payload);
  }
}
