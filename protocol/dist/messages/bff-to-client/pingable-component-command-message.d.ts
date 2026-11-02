import type { ComponentCommandActionPayload } from "./component-command-message";
import { PingableTargetedBffToClientMessage } from "./pingable-bff-to-client-message";
export declare abstract class PingableComponentCommandMessage<PAYLOAD extends ComponentCommandActionPayload = ComponentCommandActionPayload> extends PingableTargetedBffToClientMessage<PAYLOAD> {
    constructor(target: string, payload: PAYLOAD);
    get actionScope(): string;
}
