import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorJustifyLeftMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-justify-left";
  constructor(target: string) {
    super(target);
  }
}
