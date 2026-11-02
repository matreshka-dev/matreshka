import { ReliableBffToClientMessage, ReliableTargetedBffToClientMessage } from "./reliable-bff-to-client-message";
export declare abstract class PingableBffToClientMessage<PAYLOAD = unknown> extends ReliableBffToClientMessage<PAYLOAD> {
}
export declare abstract class PingableTargetedBffToClientMessage<PAYLOAD = unknown> extends ReliableTargetedBffToClientMessage<PAYLOAD> {
}
