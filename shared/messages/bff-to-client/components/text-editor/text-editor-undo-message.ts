import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorUndoMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-undo";
  constructor(target: string) {
    super(target);
  }
}
