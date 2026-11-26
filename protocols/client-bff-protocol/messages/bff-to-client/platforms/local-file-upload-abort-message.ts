import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export class LocalFileUploadAbortMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "local-file-upload-abort";
  constructor(public override readonly target: string) {
    super(target);
  }
}
