import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileDownloadFilePayload = {
  url: string;
  filename: string;
};

export class MobileDownloadFileMessage extends PingableTargetedBffToClientMessage<MobileDownloadFilePayload> {
  static readonly type = "mobile-download-file";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileDownloadFilePayload,
  ) {
    super(target, payload);
  }
}
