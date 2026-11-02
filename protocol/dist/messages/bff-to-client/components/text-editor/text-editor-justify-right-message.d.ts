import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class TextEditorJustifyRightMessage extends PingableComponentCommandMessage {
    static readonly type = "text-editor-justify-right";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
