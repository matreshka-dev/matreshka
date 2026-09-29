import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class TextEditorFormatBlockMessage extends PingableComponentCommandMessage<{
  tag: string;
}> {
  static readonly type = "text-editor-format-block";
  constructor(
    target: string,
    public override readonly payload: { tag: string },
  ) {
    super(target, payload);
  }
}
