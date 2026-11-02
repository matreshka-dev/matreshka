import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type TelegramMiniAppDownloadFilePayload = {
  url: string;
  filename: string;
};

export class TelegramMiniAppDownloadFileMessage extends PingableTargetedBffToClientMessage<TelegramMiniAppDownloadFilePayload> {
  static readonly type = "telegram-mini-app-download-file";
  constructor(
    public override readonly target: string,
    public override readonly payload: TelegramMiniAppDownloadFilePayload,
  ) {
    super(target, payload);
  }
}
