import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorToggleItalicMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-toggle-italic";
  constructor(target: string) {
    super(target);
  }
}
