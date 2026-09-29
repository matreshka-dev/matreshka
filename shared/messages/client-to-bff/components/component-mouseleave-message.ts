import { ComponentInteractionMessage } from "./component-interaction-message";

export class ComponentMouseLeaveMessage extends ComponentInteractionMessage<undefined> {
  static readonly type = "component-mouseleave";
  readonly eventType = "mouseleave";
  constructor(target: string) {
    super(target);
  }
}
