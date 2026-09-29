import { ComponentInteractionMessage } from "./component-interaction-message";

export class ComponentHideMessage extends ComponentInteractionMessage<undefined> {
  static readonly type = "component-hide";
  readonly eventType = "hide";
  constructor(target: string) {
    super(target);
  }
}
