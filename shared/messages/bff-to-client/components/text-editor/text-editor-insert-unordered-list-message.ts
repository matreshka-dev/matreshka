import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorInsertUnorderedListMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-insert-unordered-list";
  constructor(target: string) {
    super(target);
  }
}
