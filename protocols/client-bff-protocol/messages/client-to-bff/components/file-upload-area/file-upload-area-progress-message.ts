import { ComponentInteractionMessage } from "../component-interaction-message";

export class FileUploadAreaProgressMessage extends ComponentInteractionMessage<{
  id: string;
  progress: number;
}> {
  static readonly type = "file-upload-area-progress";
  readonly eventType = "progress";
  constructor(
    target: string,
    public override readonly payload: { id: string; progress: number },
  ) {
    super(target, payload);
  }
}
