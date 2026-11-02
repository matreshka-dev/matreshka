import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class TextEditorUndoMessage extends PingableComponentCommandMessage {
    static readonly type = "text-editor-undo";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
