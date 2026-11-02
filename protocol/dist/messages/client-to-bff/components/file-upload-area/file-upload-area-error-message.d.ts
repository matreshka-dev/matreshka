import { ComponentInteractionMessage } from "../component-interaction-message";
export declare class FileUploadAreaErrorMessage extends ComponentInteractionMessage<{
    id: string;
    response: unknown;
    code: number;
}> {
    readonly payload: {
        id: string;
        response: unknown;
        code: number;
    };
    static readonly type = "file-upload-area-error";
    readonly eventType = "error";
    constructor(target: string, payload: {
        id: string;
        response: unknown;
        code: number;
    });
}
