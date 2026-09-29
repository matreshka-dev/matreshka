import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorToggleUnderlineMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-toggle-underline";
  constructor(target: string) {
    super(target);
  }
}
