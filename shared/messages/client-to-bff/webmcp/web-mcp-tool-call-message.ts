import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

export type WebMcpToolCallPayload = {
  /** Аргументы вызова. Проверяются Zod-схемой тулза, если она задана. */
  input?: unknown;
};

/** Вызов WebMCP-тулза. target — id тулза, выданный BFF при объявлении. */
export class WebMcpToolCallMessage extends PingableTargetedClientToBffMessage<WebMcpToolCallPayload> {
  static readonly type = "web-mcp-tool-call";

  constructor(
    public override readonly target: string,
    public override readonly payload: WebMcpToolCallPayload = {},
  ) {
    super(target, payload);
  }
}
