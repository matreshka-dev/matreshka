import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type BrowserDownloadCsvContentPayload = {
  filename: string;
  content: string[][];
};

export class BrowserDownloadCsvContentMessage extends PingableTargetedBffToClientMessage<BrowserDownloadCsvContentPayload> {
  static readonly type = "browser-download-csv-content";
  constructor(
    public override readonly target: string,
    public override readonly payload: BrowserDownloadCsvContentPayload,
  ) {
    super(target, payload);
  }
}
