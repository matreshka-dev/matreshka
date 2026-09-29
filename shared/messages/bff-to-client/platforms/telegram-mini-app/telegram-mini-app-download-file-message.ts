import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export type TelegramMiniAppDownloadFilePayload = {
  url: string;
  filename: string;
};

export class TelegramMiniAppDownloadFileMessage extends PingableBffToClientMessage<TelegramMiniAppDownloadFilePayload> {
  static readonly type = "telegram-mini-app-download-file";
  constructor(
    public override readonly payload: TelegramMiniAppDownloadFilePayload,
  ) {
    super(payload);
  }
}
