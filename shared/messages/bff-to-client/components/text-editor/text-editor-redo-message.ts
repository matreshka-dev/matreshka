import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorRedoMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-redo";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
