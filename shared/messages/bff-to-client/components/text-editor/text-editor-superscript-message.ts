import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorSuperscriptMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-superscript";
  constructor(target: string) {
    super(target);
  }
}
