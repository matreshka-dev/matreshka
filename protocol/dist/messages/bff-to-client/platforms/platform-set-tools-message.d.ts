import type { WebMcpToolConfig } from "../../../types/web-mcp-tool-config";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export type PlatformSetToolsPayload = {
    tools: WebMcpToolConfig[];
};
export declare class PlatformSetToolsMessage extends PingableTargetedBffToClientMessage<PlatformSetToolsPayload> {
    readonly target: string;
    readonly payload: PlatformSetToolsPayload;
    static readonly type = "platform-set-tools";
    constructor(target: string, payload: PlatformSetToolsPayload);
}
