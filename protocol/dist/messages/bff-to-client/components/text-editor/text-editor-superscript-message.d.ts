import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class TextEditorSuperscriptMessage extends PingableComponentCommandMessage {
    static readonly type = "text-editor-superscript";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
