import { ComponentInteractionMessage } from "../component-interaction-message";
export declare class FileUploadAreaProgressMessage extends ComponentInteractionMessage<{
    id: string;
    progress: number;
}> {
    readonly payload: {
        id: string;
        progress: number;
    };
    static readonly type = "file-upload-area-progress";
    readonly eventType = "progress";
    constructor(target: string, payload: {
        id: string;
        progress: number;
    });
}
