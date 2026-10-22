import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorToggleBoldMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-toggle-bold";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
