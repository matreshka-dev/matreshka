import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileDownloadFilePayload = {
  url: string;
  filename: string;
};

export class MobileDownloadFileMessage extends PingableBffToClientMessage<MobileDownloadFilePayload> {
  static readonly type = "mobile-download-file";
  constructor(public override readonly payload: MobileDownloadFilePayload) {
    super(payload);
  }
}
