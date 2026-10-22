import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorSuperscriptMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-superscript";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
