import {
  ReliableBffToClientMessage,
  ReliableTargetedBffToClientMessage,
} from "./reliable-bff-to-client-message";

export abstract class PingableBffToClientMessage<
  PAYLOAD = unknown,
> extends ReliableBffToClientMessage<PAYLOAD> {}

export abstract class PingableTargetedBffToClientMessage<
  PAYLOAD = unknown,
> extends ReliableTargetedBffToClientMessage<PAYLOAD> {}
