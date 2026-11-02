import { ComponentInteractionMessage } from "./components/component-interaction-message";
export type ErrorMessagePayload = {
    message: string;
};
export declare class ErrorMessage extends ComponentInteractionMessage<ErrorMessagePayload> {
    readonly target: string;
    readonly payload: ErrorMessagePayload;
    static readonly type = "error-message";
    readonly eventType = "error";
    constructor(target: string, payload: ErrorMessagePayload);
}
