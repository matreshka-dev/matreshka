import { ComponentInteractionMessage } from "../component-interaction-message";

export class FormSubmitMessage extends ComponentInteractionMessage<undefined> {
  static readonly type = "form-submit";
  readonly eventType = "submit";
  constructor(target: string) {
    super(target);
  }
}
