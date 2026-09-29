import { AppBackMessage } from "@matreshka/shared/messages/bff-to-client/app/app-back-message";
import { BffToClientMessage } from "@matreshka/shared/messages/bff-to-client/bff-to-client-message";
import { bffToClientMessageRegistry } from "@matreshka/shared/messages/bff-to-client/bff-to-client-message-registry";
import { BffToClientMessageReceivedMessage } from "@matreshka/shared/messages/bff-to-client/message-received-message";
import { parseBffToClientMessage } from "@matreshka/shared/messages/bff-to-client/parse-bff-to-client-message";
import { registerBffToClientMessages } from "@matreshka/shared/messages/bff-to-client/register-messages";
import { AppDestroyEntryInstanceMessage } from "@matreshka/shared/messages/client-to-bff/app/app-destroy-entry-instance-message";
import { ClientToBffMessage } from "@matreshka/shared/messages/client-to-bff/client-to-bff-message";
import { clientToBffMessageRegistry } from "@matreshka/shared/messages/client-to-bff/client-to-bff-message-registry";
import { ClientToBffMessageReceivedMessage } from "@matreshka/shared/messages/client-to-bff/message-received-message";
import { parseClientToBffMessage } from "@matreshka/shared/messages/client-to-bff/parse-client-to-bff-message";
import { registerClientToBffMessages } from "@matreshka/shared/messages/client-to-bff/register-messages";
import { ReliableDelivery } from "@matreshka/shared/messages/reliable-delivery";
import { BehaviorSubject } from "rxjs";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Client } from "./client";

describe("ReliableDelivery", () => {
  beforeAll(() => {
    if (!bffToClientMessageRegistry.findByType(AppBackMessage.type)) {
      registerBffToClientMessages();
    }
    if (
      !clientToBffMessageRegistry.findByType(
        AppDestroyEntryInstanceMessage.type,
      )
    ) {
      registerClientToBffMessages();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("восстанавливает id и attempt при parse для reliable-сообщений", () => {
    const outgoing = new AppBackMessage();
    outgoing.nextAttempt();

    const parsedBff = parseBffToClientMessage(outgoing.toJSON());
    expect(parsedBff).toBeInstanceOf(AppBackMessage);
    expect((parsedBff as AppBackMessage).id).toBe(outgoing.id);
    expect((parsedBff as AppBackMessage).attempt).toBe(2);

    const clientOutgoing = new AppDestroyEntryInstanceMessage({
      id: "entry-1",
    });
    clientOutgoing.nextAttempt();

    const parsedClient = parseClientToBffMessage(clientOutgoing.toJSON());
    expect(parsedClient).toBeInstanceOf(AppDestroyEntryInstanceMessage);
    expect((parsedClient as AppDestroyEntryInstanceMessage).id).toBe(
      clientOutgoing.id,
    );
    expect((parsedClient as AppDestroyEntryInstanceMessage).attempt).toBe(2);
  });

  it("повторно отправляет reliable-сообщение и считает пинг только для текущей попытки", () => {
    vi.useFakeTimers();

    const ping$ = new BehaviorSubject<number | undefined>(undefined);
    const sentMessages: ClientToBffMessage[] = [];
    let delivery!: ReliableDelivery<BffToClientMessage, ClientToBffMessage>;

    const emitOutgoing = (message: ClientToBffMessage) => {
      delivery.observeOutgoing(message);
      sentMessages.push(message);
    };

    delivery = new ReliableDelivery({
      emitOutgoing,
      createReceipt: (payload) =>
        new ClientToBffMessageReceivedMessage(payload),
      isReceiptMessage: (message) =>
        message instanceof BffToClientMessageReceivedMessage,
      ping$,
    });

    const outgoing = new AppDestroyEntryInstanceMessage({ id: "entry-1" });
    emitOutgoing(outgoing);

    vi.advanceTimersByTime(2_000);

    expect(sentMessages).toHaveLength(2);
    expect(outgoing.attempt).toBe(2);

    delivery.handleIncoming(
      new BffToClientMessageReceivedMessage({
        id: outgoing.id,
        attempt: 1,
      }),
    );

    expect(ping$.getValue()).toBeUndefined();

    vi.advanceTimersByTime(10_000);
    expect(sentMessages).toHaveLength(2);
  });

  it("обновляет пинг, когда подтверждение относится к текущей попытке", () => {
    vi.useFakeTimers();

    const ping$ = new BehaviorSubject<number | undefined>(undefined);
    let delivery!: ReliableDelivery<BffToClientMessage, ClientToBffMessage>;

    const emitOutgoing = (message: ClientToBffMessage) => {
      delivery.observeOutgoing(message);
    };

    delivery = new ReliableDelivery({
      emitOutgoing,
      createReceipt: (payload) =>
        new ClientToBffMessageReceivedMessage(payload),
      isReceiptMessage: (message) =>
        message instanceof BffToClientMessageReceivedMessage,
      ping$,
    });

    const outgoing = new AppDestroyEntryInstanceMessage({ id: "entry-2" });
    emitOutgoing(outgoing);

    vi.advanceTimersByTime(123);

    delivery.handleIncoming(
      new BffToClientMessageReceivedMessage({
        id: outgoing.id,
        attempt: outgoing.attempt,
      }),
    );

    expect(ping$.getValue()).toBe(123);
  });

  it("pause останавливает retry до resume", () => {
    vi.useFakeTimers();

    const ping$ = new BehaviorSubject<number | undefined>(undefined);
    const sentMessages: ClientToBffMessage[] = [];
    let delivery!: ReliableDelivery<BffToClientMessage, ClientToBffMessage>;

    const emitOutgoing = (message: ClientToBffMessage) => {
      delivery.observeOutgoing(message);
      sentMessages.push(message);
    };

    delivery = new ReliableDelivery({
      emitOutgoing,
      createReceipt: (payload) =>
        new ClientToBffMessageReceivedMessage(payload),
      isReceiptMessage: (message) =>
        message instanceof BffToClientMessageReceivedMessage,
      ping$,
    });

    const outgoing = new AppDestroyEntryInstanceMessage({ id: "entry-pause" });
    emitOutgoing(outgoing);

    delivery.pause();
    vi.advanceTimersByTime(10_000);

    expect(sentMessages).toHaveLength(1);
  });

  it("сообщение, добавленное в pause, уходит при resume", () => {
    const ping$ = new BehaviorSubject<number | undefined>(undefined);
    const sentMessages: BffToClientMessage[] = [];
    let delivery!: ReliableDelivery<ClientToBffMessage, BffToClientMessage>;

    const emitOutgoing = (message: BffToClientMessage) => {
      delivery.observeOutgoing(message);
      sentMessages.push(message);
    };

    delivery = new ReliableDelivery({
      emitOutgoing,
      createReceipt: (payload) =>
        new BffToClientMessageReceivedMessage(payload),
      isReceiptMessage: (message) =>
        message instanceof ClientToBffMessageReceivedMessage,
      ping$,
    });

    delivery.pause();

    const outgoing = new AppBackMessage();
    delivery.observeOutgoing(outgoing);
    expect(sentMessages).toHaveLength(0);

    delivery.resume();
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0]).toBe(outgoing);
  });

  it("resume не re-emit'ит уже подтверждённые сообщения", () => {
    const ping$ = new BehaviorSubject<number | undefined>(undefined);
    const sentMessages: BffToClientMessage[] = [];
    let delivery!: ReliableDelivery<ClientToBffMessage, BffToClientMessage>;

    const emitOutgoing = (message: BffToClientMessage) => {
      delivery.observeOutgoing(message);
      sentMessages.push(message);
    };

    delivery = new ReliableDelivery({
      emitOutgoing,
      createReceipt: (payload) =>
        new BffToClientMessageReceivedMessage(payload),
      isReceiptMessage: (message) =>
        message instanceof ClientToBffMessageReceivedMessage,
      ping$,
    });

    const outgoing = new AppBackMessage();
    emitOutgoing(outgoing);

    delivery.handleIncoming(
      new ClientToBffMessageReceivedMessage({
        id: outgoing.id,
        attempt: outgoing.attempt,
      }),
    );

    sentMessages.length = 0;
    delivery.pause();
    delivery.resume();

    expect(sentMessages).toHaveLength(0);
  });

  it("destroy после pause очищает pending", () => {
    const ping$ = new BehaviorSubject<number | undefined>(undefined);
    const sentMessages: BffToClientMessage[] = [];
    let delivery!: ReliableDelivery<ClientToBffMessage, BffToClientMessage>;

    const emitOutgoing = (message: BffToClientMessage) => {
      delivery.observeOutgoing(message);
      sentMessages.push(message);
    };

    delivery = new ReliableDelivery({
      emitOutgoing,
      createReceipt: (payload) =>
        new BffToClientMessageReceivedMessage(payload),
      isReceiptMessage: (message) =>
        message instanceof ClientToBffMessageReceivedMessage,
      ping$,
    });

    delivery.pause();
    delivery.observeOutgoing(new AppBackMessage());
    delivery.destroy();
    delivery.resume();

    expect(sentMessages).toHaveLength(0);
  });

  it("отправляет подтверждение на каждый reliable-дубликат, но обрабатывает его один раз", () => {
    const ping$ = new BehaviorSubject<number | undefined>(undefined);
    const receipts: BffToClientMessage[] = [];

    const delivery = new ReliableDelivery<
      ClientToBffMessage,
      BffToClientMessage
    >({
      emitOutgoing: (message) => receipts.push(message),
      createReceipt: (payload) =>
        new BffToClientMessageReceivedMessage(payload),
      isReceiptMessage: (message) =>
        message instanceof ClientToBffMessageReceivedMessage,
      ping$: ping$,
    });

    const incoming = new AppDestroyEntryInstanceMessage({ id: "entry-3" });
    const duplicate = parseClientToBffMessage(incoming.toJSON());

    expect(delivery.handleIncoming(incoming)).toBe(incoming);
    expect(delivery.handleIncoming(duplicate)).toBeUndefined();

    expect(receipts).toHaveLength(2);
    expect(receipts[0]).toBeInstanceOf(BffToClientMessageReceivedMessage);
    expect((receipts[0] as BffToClientMessageReceivedMessage).payload).toEqual({
      id: incoming.id,
      attempt: incoming.attempt,
    });
  });
});

describe("Client reliable delivery", () => {
  beforeAll(() => {
    if (
      !clientToBffMessageRegistry.findByType(
        AppDestroyEntryInstanceMessage.type,
      )
    ) {
      registerClientToBffMessages();
    }
    if (!bffToClientMessageRegistry.findByType(AppBackMessage.type)) {
      registerBffToClientMessages();
    }
  });

  it("при disconnect reliable копится в pending и уходит после reconnect", () => {
    vi.useFakeTimers();

    const client = new Client();
    const transport: BffToClientMessage[] = [];

    client.attachTransport((message) => transport.push(message));

    const first = new AppBackMessage();
    client.outcomingMessage$.next(first);
    expect(transport).toHaveLength(1);

    client.detachTransport();
    client.disconnect$.next();

    const queued = new AppBackMessage();
    client.outcomingMessage$.next(queued);
    expect(transport).toHaveLength(1);

    vi.advanceTimersByTime(10_000);
    expect(transport).toHaveLength(1);

    transport.length = 0;
    client.attachTransport((message) => transport.push(message));
    client.reconnect$.next();

    expect(transport).toHaveLength(2);
    expect(transport).toContain(first);
    expect(transport).toContain(queued);
  });

  it("destroy очищает pending после disconnect", () => {
    const client = new Client();
    const transport: BffToClientMessage[] = [];

    client.attachTransport((message) => transport.push(message));
    client.outcomingMessage$.next(new AppBackMessage());

    client.detachTransport();
    client.disconnect$.next();
    client.outcomingMessage$.next(new AppBackMessage());

    client.destroy();

    transport.length = 0;
    client.attachTransport((message) => transport.push(message));
    client.reconnect$.next();

    expect(transport).toHaveLength(0);
  });

  it("на входящее reliable-сообщение отвечает подтверждением и не обрабатывает дубликат дважды", () => {
    const client = new Client();
    const receipts: BffToClientMessage[] = [];
    const handled: ClientToBffMessage[] = [];

    client.outcomingMessage$.subscribe((message) => receipts.push(message));
    client.incomingMessage$.subscribe((message) => handled.push(message));

    const incoming = new AppDestroyEntryInstanceMessage({ id: "entry-4" });
    const payload = JSON.stringify(incoming.toJSON());

    client.newMessage(payload);
    client.newMessage(payload);

    expect(handled).toHaveLength(1);
    expect(handled[0]).toBeInstanceOf(AppDestroyEntryInstanceMessage);
    expect(receipts).toHaveLength(2);
    expect(receipts[0]).toBeInstanceOf(BffToClientMessageReceivedMessage);
    expect((receipts[0] as BffToClientMessageReceivedMessage).payload).toEqual({
      id: incoming.id,
      attempt: incoming.attempt,
    });
  });
});
