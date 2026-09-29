import { ComponentInteractionMessage } from "../component-interaction-message";

/**
 * Событие от клиента к BFF: изменился выделенный текст в text-editor.
 */
export class TextEditorSelectionChangeMessage extends ComponentInteractionMessage<string> {
  static readonly type = "text-editor-selection-change";
  readonly eventType = "selection-change";
  constructor(
    public override readonly target: string,
    public override readonly payload: string,
  ) {
    super(target, payload);
  }
}
