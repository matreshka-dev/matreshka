import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export type TextEditorInsertHtmlPayload = ComponentCommandActionPayload & {
  value: string;
};

export class TextEditorInsertHtmlMessage extends PingableComponentCommandMessage<TextEditorInsertHtmlPayload> {
  static readonly type = "text-editor-insert-html";
  constructor(
    target: string,
    public override readonly payload: TextEditorInsertHtmlPayload,
  ) {
    super(target, payload);
  }
}
