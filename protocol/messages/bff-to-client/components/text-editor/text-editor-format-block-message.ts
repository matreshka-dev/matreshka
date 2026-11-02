import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export type TextEditorFormatBlockPayload = ComponentCommandActionPayload & {
  tag: string;
};

export class TextEditorFormatBlockMessage extends PingableComponentCommandMessage<TextEditorFormatBlockPayload> {
  static readonly type = "text-editor-format-block";
  constructor(
    target: string,
    public override readonly payload: TextEditorFormatBlockPayload,
  ) {
    super(target, payload);
  }
}
