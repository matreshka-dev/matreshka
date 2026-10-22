import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorToggleItalicMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-toggle-italic";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
