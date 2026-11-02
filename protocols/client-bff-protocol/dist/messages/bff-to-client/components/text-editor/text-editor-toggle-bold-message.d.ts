import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class TextEditorToggleBoldMessage extends PingableComponentCommandMessage {
    static readonly type = "text-editor-toggle-bold";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
