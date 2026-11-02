import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class TextEditorRedoMessage extends PingableComponentCommandMessage {
    static readonly type = "text-editor-redo";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
