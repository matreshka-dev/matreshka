import type { WebMcpToolConfig } from "../../../types/web-mcp-tool-config";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

/** Метаданные WebMCP-тулзов платформы. `execute` остаётся на BFF. */
export type PlatformSetToolsPayload = {
  tools: WebMcpToolConfig[];
};

/**
 * Установка платформенных WebMCP-тулзов: вне страницы, переживают навигацию.
 * Новый список заменяет предыдущий.
 */
export class PlatformSetToolsMessage extends PingableTargetedBffToClientMessage<PlatformSetToolsPayload> {
  static readonly type = "platform-set-tools";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformSetToolsPayload,
  ) {
    super(target, payload);
  }
}
