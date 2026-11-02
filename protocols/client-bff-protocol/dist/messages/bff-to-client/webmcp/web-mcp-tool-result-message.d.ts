import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export type WebMcpToolResultPayload = {
    result: string;
    callId: string;
};
export declare class WebMcpToolResultMessage extends PingableTargetedBffToClientMessage<WebMcpToolResultPayload> {
    readonly target: string;
    readonly payload: WebMcpToolResultPayload;
    static readonly type = "web-mcp-tool-result";
    constructor(target: string, payload: WebMcpToolResultPayload);
}
