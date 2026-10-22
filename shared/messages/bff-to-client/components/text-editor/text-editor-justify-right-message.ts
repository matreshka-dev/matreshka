import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorJustifyRightMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-justify-right";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
