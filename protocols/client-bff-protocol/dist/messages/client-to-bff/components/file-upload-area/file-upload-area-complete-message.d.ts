import { ComponentInteractionMessage } from "../component-interaction-message";
export declare class FileUploadAreaCompleteMessage extends ComponentInteractionMessage<{
    id: string;
    response: unknown;
}> {
    readonly payload: {
        id: string;
        response: unknown;
    };
    static readonly type = "file-upload-area-complete";
    readonly eventType = "complete";
    constructor(target: string, payload: {
        id: string;
        response: unknown;
    });
}
