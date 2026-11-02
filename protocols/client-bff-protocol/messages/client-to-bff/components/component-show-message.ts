import { ComponentInteractionMessage } from "./component-interaction-message";

export class ComponentShowMessage extends ComponentInteractionMessage<undefined> {
  static readonly type = "component-show";
  readonly eventType = "show";
  constructor(target: string) {
    super(target);
  }
}
