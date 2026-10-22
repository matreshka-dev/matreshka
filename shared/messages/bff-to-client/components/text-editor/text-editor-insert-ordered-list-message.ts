import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorInsertOrderedListMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-insert-ordered-list";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
