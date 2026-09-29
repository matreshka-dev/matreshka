import { ComponentInteractionMessage } from "../component-interaction-message";

export class FileUploadAreaCompleteMessage extends ComponentInteractionMessage<{
  id: string;
  response: unknown;
}> {
  static readonly type = "file-upload-area-complete";
  readonly eventType = "complete";
  constructor(
    target: string,
    public override readonly payload: { id: string; response: unknown },
  ) {
    super(target, payload);
  }
}
