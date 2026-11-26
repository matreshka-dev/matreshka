import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

export type LocalFileUploadSuccessPayload = {
  response: unknown;
};

export class LocalFileUploadSuccessMessage extends PingableTargetedClientToBffMessage<LocalFileUploadSuccessPayload> {
  static readonly type = "local-file-upload-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: LocalFileUploadSuccessPayload,
  ) {
    super(target, payload);
  }
}
