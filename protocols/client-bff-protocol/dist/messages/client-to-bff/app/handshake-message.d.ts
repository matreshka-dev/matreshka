import { ReliableClientToBffMessage } from "../reliable-client-to-bff-message";
export type ClientHandshakePayload = {
    applicationId: string;
    protocolVersion: string;
};
export type ClientHandshakeInput = Omit<ClientHandshakePayload, "protocolVersion">;
export declare class HandshakeMessage extends ReliableClientToBffMessage<ClientHandshakePayload> {
    static readonly type = "handshake";
    constructor(input: ClientHandshakeInput);
}
