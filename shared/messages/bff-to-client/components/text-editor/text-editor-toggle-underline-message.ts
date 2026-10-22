import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorToggleUnderlineMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-toggle-underline";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
