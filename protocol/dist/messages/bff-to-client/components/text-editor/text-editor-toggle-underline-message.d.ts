import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class TextEditorToggleUnderlineMessage extends PingableComponentCommandMessage {
    static readonly type = "text-editor-toggle-underline";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
