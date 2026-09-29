import { GatewayToBffMessage } from "./gateway-to-bff-message";

export type SessionOpenPayload = {
  sessionId: string;
  reconnectToken?: string;
};

/** Gateway → BFF: открыта клиентская сессия (новая или reconnect). */
export class SessionOpenMessage extends GatewayToBffMessage<SessionOpenPayload> {
  static readonly type = "session-open";

  constructor(public override readonly payload: SessionOpenPayload) {
    super(payload);
  }
}
