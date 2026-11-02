import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type BrowserOpenFilePayload = {
  url: string;
};

export class BrowserOpenFileMessage extends PingableTargetedBffToClientMessage<BrowserOpenFilePayload> {
  static readonly type = "browser-open-file";
  constructor(
    public override readonly target: string,
    public override readonly payload: BrowserOpenFilePayload,
  ) {
    super(target, payload);
  }
}
