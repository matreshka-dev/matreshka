import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type WebMcpToolResultPayload = {
  result: string;
  /** Reliable id входящего web-mcp-tool-call. */
  callId: string;
};

/** Успешный результат execute. target — id тулза. */
export class WebMcpToolResultMessage extends PingableTargetedBffToClientMessage<WebMcpToolResultPayload> {
  static readonly type = "web-mcp-tool-result";

  constructor(
    public override readonly target: string,
    public override readonly payload: WebMcpToolResultPayload,
  ) {
    super(target, payload);
  }
}
