import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export type TextEditorFormatBlockPayload = ComponentCommandActionPayload & {
    tag: string;
};
export declare class TextEditorFormatBlockMessage extends PingableComponentCommandMessage<TextEditorFormatBlockPayload> {
    readonly payload: TextEditorFormatBlockPayload;
    static readonly type = "text-editor-format-block";
    constructor(target: string, payload: TextEditorFormatBlockPayload);
}
