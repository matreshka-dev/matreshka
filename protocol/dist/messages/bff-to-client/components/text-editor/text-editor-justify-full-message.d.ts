import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class TextEditorJustifyFullMessage extends PingableComponentCommandMessage {
    static readonly type = "text-editor-justify-full";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
