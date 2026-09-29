import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorJustifyFullMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-justify-full";
  constructor(target: string) {
    super(target);
  }
}
