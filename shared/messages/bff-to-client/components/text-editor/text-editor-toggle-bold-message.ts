import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorToggleBoldMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-toggle-bold";
  constructor(target: string) {
    super(target);
  }
}
