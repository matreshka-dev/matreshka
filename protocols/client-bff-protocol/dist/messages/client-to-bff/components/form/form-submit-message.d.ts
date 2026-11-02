import { ComponentInteractionMessage } from "../component-interaction-message";
export declare class FormSubmitMessage extends ComponentInteractionMessage<undefined> {
    static readonly type = "form-submit";
    readonly eventType = "submit";
    constructor(target: string);
}
