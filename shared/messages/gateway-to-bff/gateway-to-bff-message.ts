import { Message } from "../message";

export abstract class GatewayToBffMessage<
  PAYLOAD = unknown,
> extends Message<PAYLOAD> {
  protected constructor(payload: PAYLOAD) {
    super(payload);
  }
}
