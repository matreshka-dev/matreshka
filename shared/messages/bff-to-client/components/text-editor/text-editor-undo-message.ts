import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorUndoMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-undo";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
