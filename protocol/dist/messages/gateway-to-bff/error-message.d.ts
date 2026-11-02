import { GatewayToBffMessage } from "./gateway-to-bff-message";
export type ErrorPayload = {
    message: string;
};
export declare class ErrorMessage extends GatewayToBffMessage<ErrorPayload> {
    readonly payload: ErrorPayload;
    static readonly type = "error";
    constructor(payload: ErrorPayload);
}
