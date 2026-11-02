import { ComponentInteractionMessage } from "./component-interaction-message";

export class ComponentClickMessage extends ComponentInteractionMessage<{}> {
  static readonly type = "component-click";
  readonly eventType = "click";
  constructor(target: string) {
    super(target, {});
  }
}
