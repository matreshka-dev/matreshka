import { GatewayToBffMessage } from "./gateway-to-bff-message";

export type ErrorPayload = {
  message: string;
};

/** Gateway → BFF: ошибка (в т.ч. при отклонении проверки). */
export class ErrorMessage extends GatewayToBffMessage<ErrorPayload> {
  static readonly type = "error";

  constructor(public override readonly payload: ErrorPayload) {
    super(payload);
  }
}
