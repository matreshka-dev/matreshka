import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type WebMcpToolErrorPayload = {
  message: string;
  /** Reliable id входящего web-mcp-tool-call. */
  callId: string;
};

/** Ошибка execute. target — id тулза. */
export class WebMcpToolErrorMessage extends PingableTargetedBffToClientMessage<WebMcpToolErrorPayload> {
  static readonly type = "web-mcp-tool-error";

  constructor(
    public override readonly target: string,
    public override readonly payload: WebMcpToolErrorPayload,
  ) {
    super(target, payload);
  }
}
