import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorJustifyCenterMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-justify-center";
  constructor(target: string, payload: ComponentCommandActionPayload) {
    super(target, payload);
  }
}
