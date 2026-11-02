import { Message } from "../message";

export abstract class BffToGatewayMessage<
  PAYLOAD = unknown,
> extends Message<PAYLOAD> {
  protected constructor(payload: PAYLOAD) {
    super(payload);
  }
}
