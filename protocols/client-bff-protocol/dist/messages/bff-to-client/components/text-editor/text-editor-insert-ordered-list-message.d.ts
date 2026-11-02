import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class TextEditorInsertOrderedListMessage extends PingableComponentCommandMessage {
    static readonly type = "text-editor-insert-ordered-list";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
