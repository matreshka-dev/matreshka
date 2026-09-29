import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorRedoMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-redo";
  constructor(target: string) {
    super(target);
  }
}
