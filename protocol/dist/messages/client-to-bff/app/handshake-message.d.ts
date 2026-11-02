import { ReliableClientToBffMessage } from "../reliable-client-to-bff-message";
export type ClientHandshakePayload = {
    applicationId: string;
};
export declare class HandshakeMessage extends ReliableClientToBffMessage<ClientHandshakePayload> {
    readonly payload: ClientHandshakePayload;
    static readonly type = "handshake";
    constructor(payload: ClientHandshakePayload);
}
