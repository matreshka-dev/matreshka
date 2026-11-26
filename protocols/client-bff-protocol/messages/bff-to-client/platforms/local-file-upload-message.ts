import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type LocalFileUploadPayload = {
  fileId: string;
  url: string;
  fieldName?: string;
  headers?: Record<string, string>;
  fields?: Record<string, string>;
};

export class LocalFileUploadMessage extends PingableTargetedBffToClientMessage<LocalFileUploadPayload> {
  static readonly type = "local-file-upload";
  constructor(
    public override readonly target: string,
    public override readonly payload: LocalFileUploadPayload,
  ) {
    super(target, payload);
  }
}
