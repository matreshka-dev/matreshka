import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export type WebMcpToolErrorPayload = {
    message: string;
    callId: string;
};
export declare class WebMcpToolErrorMessage extends PingableTargetedBffToClientMessage<WebMcpToolErrorPayload> {
    readonly target: string;
    readonly payload: WebMcpToolErrorPayload;
    static readonly type = "web-mcp-tool-error";
    constructor(target: string, payload: WebMcpToolErrorPayload);
}
