import { ClientState } from "../../../types/client-state";
import { ReliableClientToBffMessage } from "../reliable-client-to-bff-message";

export class AppClientStateMessage extends ReliableClientToBffMessage<ClientState> {
  static readonly type = "client-state";
  constructor(public override readonly payload: ClientState) {
    super(payload);
  }
}
