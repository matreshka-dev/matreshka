import { ClientState } from "../../../types/client-state";
import { ReliableClientToBffMessage } from "../reliable-client-to-bff-message";
export declare class AppClientStateMessage extends ReliableClientToBffMessage<ClientState> {
    readonly payload: ClientState;
    static readonly type = "client-state";
    constructor(payload: ClientState);
}
