import { ReliableClientToBffMessage, ReliableTargetedClientToBffMessage } from "./reliable-client-to-bff-message";
export declare abstract class PingableClientToBffMessage<PAYLOAD = unknown> extends ReliableClientToBffMessage<PAYLOAD> {
}
export declare abstract class PingableTargetedClientToBffMessage<PAYLOAD = unknown> extends ReliableTargetedClientToBffMessage<PAYLOAD> {
}
