"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReliableDelivery = void 0;
exports.isReliableMessage = isReliableMessage;
exports.isPingableMessage = isPingableMessage;
const rxjs_1 = require("rxjs");
const pingable_bff_to_client_message_1 = require("./bff-to-client/pingable-bff-to-client-message");
const reliable_bff_to_client_message_1 = require("./bff-to-client/reliable-bff-to-client-message");
const pingable_client_to_bff_message_1 = require("./client-to-bff/pingable-client-to-bff-message");
const reliable_client_to_bff_message_1 = require("./client-to-bff/reliable-client-to-bff-message");
const DEFAULT_RETRY_TIMEOUT_MS = 2000;
const DEFAULT_MAX_RECEIVED_IDS = 1000;
class ReliableDelivery {
    constructor(config) {
        this.config = config;
        this.pending = new Map();
        this.receiptSubjects = new Map();
        this.receivedIds = new Set();
        this.receivedOrder = [];
        this.paused = false;
        this.retryTimeoutMs = config.retryTimeoutMs ?? DEFAULT_RETRY_TIMEOUT_MS;
        this.maxReceivedIds = config.maxReceivedIds ?? DEFAULT_MAX_RECEIVED_IDS;
    }
    observeOutgoing(message) {
        if (!isReliableMessage(message)) {
            return;
        }
        const existingEntry = this.pending.get(message.id);
        if (existingEntry) {
            existingEntry.timer.unsubscribe();
        }
        this.pending.set(message.id, {
            message,
            sentAt: Date.now(),
            timer: this.paused ? new rxjs_1.Subscription() : this.createRetryTimer(message),
        });
    }
    waitForReceipt(message) {
        if (!isReliableMessage(message)) {
            const result$ = new rxjs_1.ReplaySubject(1);
            result$.next(undefined);
            result$.complete();
            return result$.asObservable();
        }
        const existing = this.receiptSubjects.get(message.id);
        if (existing) {
            return existing.asObservable();
        }
        const subject = new rxjs_1.ReplaySubject(1);
        this.receiptSubjects.set(message.id, subject);
        return subject.asObservable();
    }
    pause() {
        if (this.paused) {
            return;
        }
        this.paused = true;
        for (const entry of this.pending.values()) {
            entry.timer.unsubscribe();
        }
    }
    resume() {
        if (!this.paused) {
            return;
        }
        this.paused = false;
        for (const entry of this.pending.values()) {
            this.config.emitOutgoing(entry.message);
        }
    }
    handleIncoming(message) {
        if (this.config.isReceiptMessage(message)) {
            this.handleReceipt(message);
            return undefined;
        }
        if (!isReliableMessage(message)) {
            return message;
        }
        this.config.emitOutgoing(this.config.createReceipt({
            id: message.id,
            attempt: message.attempt,
        }));
        if (this.receivedIds.has(message.id)) {
            return undefined;
        }
        this.rememberReceivedId(message.id);
        return message;
    }
    destroy() {
        this.paused = false;
        for (const entry of this.pending.values()) {
            entry.timer.unsubscribe();
        }
        this.pending.clear();
        for (const subject of this.receiptSubjects.values()) {
            subject.complete();
        }
        this.receiptSubjects.clear();
        this.receivedIds.clear();
        this.receivedOrder.length = 0;
    }
    handleReceipt(message) {
        const pendingEntry = this.pending.get(message.payload.id);
        if (!pendingEntry) {
            return;
        }
        pendingEntry.timer.unsubscribe();
        this.pending.delete(message.payload.id);
        if (isPingableMessage(pendingEntry.message) &&
            message.payload.attempt === pendingEntry.message.attempt) {
            this.config.ping$.next(Date.now() - pendingEntry.sentAt);
        }
        this.receiptSubjects.get(message.payload.id)?.next(undefined);
        this.receiptSubjects.get(message.payload.id)?.complete();
        this.receiptSubjects.delete(message.payload.id);
    }
    createRetryTimer(message) {
        return (0, rxjs_1.timer)(this.retryTimeoutMs).subscribe(() => {
            if (this.paused || !this.pending.has(message.id)) {
                return;
            }
            message.nextAttempt();
            this.config.emitOutgoing(message);
        });
    }
    rememberReceivedId(id) {
        if (this.receivedIds.has(id)) {
            return;
        }
        this.receivedIds.add(id);
        this.receivedOrder.push(id);
        if (this.receivedOrder.length > this.maxReceivedIds) {
            const oldestId = this.receivedOrder.shift();
            if (oldestId) {
                this.receivedIds.delete(oldestId);
            }
        }
    }
}
exports.ReliableDelivery = ReliableDelivery;
function isReliableMessage(message) {
    return ((0, reliable_bff_to_client_message_1.isReliableBffToClientMessage)(message) ||
        (0, reliable_client_to_bff_message_1.isReliableClientToBffMessage)(message));
}
function isPingableMessage(message) {
    return (message instanceof pingable_bff_to_client_message_1.PingableBffToClientMessage ||
        message instanceof pingable_client_to_bff_message_1.PingableClientToBffMessage ||
        message instanceof pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage ||
        message instanceof pingable_client_to_bff_message_1.PingableTargetedClientToBffMessage);
}
