import { ComponentInteractionMessage } from "../component-interaction-message";

export type FileUploadAreaStartPayload = {
  id: string;
  type: string;
  size: number;
  name: string;
  lastModified: number;
  url: string;
};

export class FileUploadAreaStartMessage extends ComponentInteractionMessage<FileUploadAreaStartPayload> {
  static readonly type = "file-upload-area-start";
  readonly eventType = "start";
  constructor(
    target: string,
    public override readonly payload: FileUploadAreaStartPayload,
  ) {
    super(target, payload);
  }
}
