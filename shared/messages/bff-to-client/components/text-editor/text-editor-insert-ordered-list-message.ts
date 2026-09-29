import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorInsertOrderedListMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-insert-ordered-list";
  constructor(target: string) {
    super(target);
  }
}
