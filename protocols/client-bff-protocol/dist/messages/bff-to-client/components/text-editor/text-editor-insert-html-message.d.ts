import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export type TextEditorInsertHtmlPayload = ComponentCommandActionPayload & {
    value: string;
};
export declare class TextEditorInsertHtmlMessage extends PingableComponentCommandMessage<TextEditorInsertHtmlPayload> {
    readonly payload: TextEditorInsertHtmlPayload;
    static readonly type = "text-editor-insert-html";
    constructor(target: string, payload: TextEditorInsertHtmlPayload);
}
