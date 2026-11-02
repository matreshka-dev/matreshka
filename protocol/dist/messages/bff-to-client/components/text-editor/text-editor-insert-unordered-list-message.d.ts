import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class TextEditorInsertUnorderedListMessage extends PingableComponentCommandMessage {
    static readonly type = "text-editor-insert-unordered-list";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
