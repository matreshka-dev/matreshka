import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class TextEditorToggleItalicMessage extends PingableComponentCommandMessage {
    static readonly type = "text-editor-toggle-italic";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
