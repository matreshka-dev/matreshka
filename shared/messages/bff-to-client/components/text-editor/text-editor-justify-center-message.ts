import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorJustifyCenterMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-justify-center";
  constructor(target: string) {
    super(target);
  }
}
