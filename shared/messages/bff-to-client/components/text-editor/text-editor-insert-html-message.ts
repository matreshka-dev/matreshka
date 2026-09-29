import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorInsertHtmlMessage extends PingableComponentCommandMessage<{
  value: string;
}> {
  static readonly type = "text-editor-insert-html";
  constructor(
    target: string,
    public override readonly payload: { value: string },
  ) {
    super(target, payload);
  }
}
