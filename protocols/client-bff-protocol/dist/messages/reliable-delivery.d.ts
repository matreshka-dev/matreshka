import { Observable } from "rxjs";
import { BffToClientMessage, TargetedBffToClientMessage } from "./bff-to-client/bff-to-client-message";
import { PingableBffToClientMessage, PingableTargetedBffToClientMessage } from "./bff-to-client/pingable-bff-to-client-message";
import { ReliableBffToClientMessage, ReliableTargetedBffToClientMessage } from "./bff-to-client/reliable-bff-to-client-message";
import { ClientToBffMessage, TargetedClientToBffMessage } from "./client-to-bff/client-to-bff-message";
import { PingableClientToBffMessage, PingableTargetedClientToBffMessage } from "./client-to-bff/pingable-client-to-bff-message";
import { ReliableClientToBffMessage, ReliableTargetedClientToBffMessage } from "./client-to-bff/reliable-client-to-bff-message";
import { MessageReceivedPayload } from "./reliable-message";
type AnyIncomingMessage = BffToClientMessage | ClientToBffMessage | TargetedBffToClientMessage | TargetedClientToBffMessage;
type AnyOutgoingMessage = AnyIncomingMessage;
type AnyReliableMessage = ReliableBffToClientMessage | ReliableClientToBffMessage | ReliableTargetedBffToClientMessage | ReliableTargetedClientToBffMessage;
type AnyPingableMessage = PingableBffToClientMessage | PingableClientToBffMessage | PingableTargetedBffToClientMessage | PingableTargetedClientToBffMessage;
type PingSink = {
    next(value: number | undefined): void;
};
type ReliableDeliveryConfig<INCOMING extends AnyIncomingMessage, OUTGOING extends AnyOutgoingMessage> = {
    emitOutgoing: (message: OUTGOING) => void;
    createReceipt: (payload: MessageReceivedPayload) => OUTGOING;
    isReceiptMessage: (message: INCOMING) => boolean;
    ping$: PingSink;
    retryTimeoutMs?: number;
    maxReceivedIds?: number;
};
export declare class ReliableDelivery<INCOMING extends AnyIncomingMessage, OUTGOING extends AnyOutgoingMessage> {
    private readonly config;
    private readonly pending;
    private readonly receiptSubjects;
    private readonly receivedIds;
    private readonly receivedOrder;
    private readonly retryTimeoutMs;
    private readonly maxReceivedIds;
    private paused;
    constructor(config: ReliableDeliveryConfig<INCOMING, OUTGOING>);
    observeOutgoing(message: OUTGOING): void;
    waitForReceipt(message: OUTGOING): Observable<void>;
    pause(): void;
    resume(): void;
    handleIncoming(message: INCOMING): INCOMING | undefined;
    destroy(): void;
    private handleReceipt;
    private createRetryTimer;
    private rememberReceivedId;
}
export declare function isReliableMessage(message: AnyIncomingMessage): message is AnyReliableMessage;
export declare function isPingableMessage(message: AnyIncomingMessage): message is AnyPingableMessage;
export {};
