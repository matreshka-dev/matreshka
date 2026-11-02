import { GatewayToBffMessage } from "./gateway-to-bff-message";

export type SessionClosePayload = {
  sessionId: string;
};

/** Gateway → BFF: клиентская сессия закрыта. */
export class SessionCloseMessage extends GatewayToBffMessage<SessionClosePayload> {
  static readonly type = "session-close";

  constructor(public override readonly payload: SessionClosePayload) {
    super(payload);
  }
}
