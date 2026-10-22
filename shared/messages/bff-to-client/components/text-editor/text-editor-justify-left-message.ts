import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorJustifyLeftMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-justify-left";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
