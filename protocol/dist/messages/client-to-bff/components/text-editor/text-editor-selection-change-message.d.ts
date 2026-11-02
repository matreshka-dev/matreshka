import { ComponentInteractionMessage } from "../component-interaction-message";
export declare class TextEditorSelectionChangeMessage extends ComponentInteractionMessage<string> {
    readonly target: string;
    readonly payload: string;
    static readonly type = "text-editor-selection-change";
    readonly eventType = "selection-change";
    constructor(target: string, payload: string);
}
