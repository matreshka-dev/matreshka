import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";
export type WebMcpToolCallPayload = {
    input?: unknown;
};
export declare class WebMcpToolCallMessage extends PingableTargetedClientToBffMessage<WebMcpToolCallPayload> {
    readonly target: string;
    readonly payload: WebMcpToolCallPayload;
    static readonly type = "web-mcp-tool-call";
    constructor(target: string, payload?: WebMcpToolCallPayload);
}
