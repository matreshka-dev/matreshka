import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorJustifyCenterMessage extends PingableComponentCommandMessage {
  static readonly type = "text-editor-justify-center";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
