import { ComponentInteractionMessage } from "../component-interaction-message";

export class FileUploadAreaErrorMessage extends ComponentInteractionMessage<{
  id: string;
  response: unknown;
  code: number;
}> {
  static readonly type = "file-upload-area-error";
  readonly eventType = "error";
  constructor(
    target: string,
    public override readonly payload: {
      id: string;
      response: unknown;
      code: number;
    },
  ) {
    super(target, payload);
  }
}
