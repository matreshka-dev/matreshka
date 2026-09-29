import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export type BrowserDownloadCsvContentPayload = {
  filename: string;
  content: string[][];
};

export class BrowserDownloadCsvContentMessage extends PingableBffToClientMessage<BrowserDownloadCsvContentPayload> {
  static readonly type = "browser-download-csv-content";
  constructor(
    public override readonly payload: BrowserDownloadCsvContentPayload,
  ) {
    super(payload);
  }
}
