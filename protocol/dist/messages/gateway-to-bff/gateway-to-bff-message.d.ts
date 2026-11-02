import { Message } from "../message";
export declare abstract class GatewayToBffMessage<PAYLOAD = unknown> extends Message<PAYLOAD> {
    protected constructor(payload: PAYLOAD);
}
