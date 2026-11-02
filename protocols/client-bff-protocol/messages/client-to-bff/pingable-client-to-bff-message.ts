import {
  ReliableClientToBffMessage,
  ReliableTargetedClientToBffMessage,
} from "./reliable-client-to-bff-message";

export abstract class PingableClientToBffMessage<
  PAYLOAD = unknown,
> extends ReliableClientToBffMessage<PAYLOAD> {}

export abstract class PingableTargetedClientToBffMessage<
  PAYLOAD = unknown,
> extends ReliableTargetedClientToBffMessage<PAYLOAD> {}
