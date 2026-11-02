import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorJustifyLeftMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-justify-left";
  constructor(target: string, payload: ComponentCommandActionPayload) {
    super(target, payload);
  }
}
