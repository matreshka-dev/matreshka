import { ComponentInteractionMessage } from "./component-interaction-message";

export class ComponentLeaveMessage extends ComponentInteractionMessage<undefined> {
  static readonly type = "component-leave";
  readonly eventType = "leave";
  constructor(target: string) {
    super(target);
  }
}
