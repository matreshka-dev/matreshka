import { ComponentInteractionMessage } from "./component-interaction-message";

export class ComponentMouseEnterMessage extends ComponentInteractionMessage<undefined> {
  static readonly type = "component-mouseenter";
  readonly eventType = "mouseenter";
  constructor(target: string) {
    super(target);
  }
}
