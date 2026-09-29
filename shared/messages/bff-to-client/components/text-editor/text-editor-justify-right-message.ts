import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorJustifyRightMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "text-editor-justify-right";
  constructor(target: string) {
    super(target);
  }
}
