import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorInsertUnorderedListMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-insert-unordered-list";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
