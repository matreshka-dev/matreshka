import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileDownloadCsvContentPayload = {
  filename: string;
  content: string[][];
};

export class MobileDownloadCsvContentMessage extends PingableBffToClientMessage<MobileDownloadCsvContentPayload> {
  static readonly type = "mobile-download-csv-content";
  constructor(
    public override readonly payload: MobileDownloadCsvContentPayload,
  ) {
    super(payload);
  }
}
