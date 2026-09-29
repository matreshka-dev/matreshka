import { ComponentInteractionMessage } from "./components/component-interaction-message";

export type ErrorMessagePayload = {
  message: string;
};

/**
 * Ошибка по target (компонент, платформа и т.д.); для компонентов `eventType` = error.
 */
export class ErrorMessage extends ComponentInteractionMessage<ErrorMessagePayload> {
  static readonly type = "error-message";
  readonly eventType = "error";
  constructor(
    public override readonly target: string,
    public override readonly payload: ErrorMessagePayload,
  ) {
    super(target, payload);
  }
}
