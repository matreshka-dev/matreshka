import { ComponentInteractionMessage } from "../component-interaction-message";

/** Метаданные выбранного файла на wire (как у File API; blob живёт на клиенте). */
export type FilePickerFilePayload = {
  id: string;
  type: string;
  size: number;
  name: string;
  lastModified: number;
  url: string;
};

export type FilePickerSelectPayload = {
  files: FilePickerFilePayload[];
};

export class FilePickerSelectMessage extends ComponentInteractionMessage<FilePickerSelectPayload> {
  static readonly type = "file-picker-select";
  readonly eventType = "select";
  constructor(
    target: string,
    public override readonly payload: FilePickerSelectPayload,
  ) {
    super(target, payload);
  }
}
