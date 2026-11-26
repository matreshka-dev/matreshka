import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

export type LocalFileUploadProgressPayload = {
  progress: number;
};

export class LocalFileUploadProgressMessage extends PingableTargetedClientToBffMessage<LocalFileUploadProgressPayload> {
  static readonly type = "local-file-upload-progress";
  constructor(
    public override readonly target: string,
    public override readonly payload: LocalFileUploadProgressPayload,
  ) {
    super(target, payload);
  }
}
