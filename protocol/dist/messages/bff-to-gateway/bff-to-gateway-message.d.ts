import { Message } from "../message";
export declare abstract class BffToGatewayMessage<PAYLOAD = unknown> extends Message<PAYLOAD> {
    protected constructor(payload: PAYLOAD);
}
