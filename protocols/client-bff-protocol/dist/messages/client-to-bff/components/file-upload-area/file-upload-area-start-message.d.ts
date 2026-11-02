import { ComponentInteractionMessage } from "../component-interaction-message";
export type FileUploadAreaStartPayload = {
    id: string;
    type: string;
    size: number;
    name: string;
    lastModified: number;
    url: string;
};
export declare class FileUploadAreaStartMessage extends ComponentInteractionMessage<FileUploadAreaStartPayload> {
    readonly payload: FileUploadAreaStartPayload;
    static readonly type = "file-upload-area-start";
    readonly eventType = "start";
    constructor(target: string, payload: FileUploadAreaStartPayload);
}
