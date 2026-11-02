import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorJustifyRightMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-justify-right";
  constructor(target: string, payload: ComponentCommandActionPayload) {
    super(target, payload);
  }
}
