import { ContextValuesMessage as ClientToBffContextValuesMessage } from "@matreshka/shared/messages/client-to-bff/context/index";
import { BehaviorSubject, Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import type { Client } from "../client";
import { Context } from "./context";

vi.mock("../client", () => {
  class FakeClient {
    destroy$ = new BehaviorSubject<void>(undefined as any);
    outcomingMessage$ = new BehaviorSubject<any>(null as any);
    incomingMessage$ = new BehaviorSubject<any>(null as any);
    error$ = new BehaviorSubject<any>(null as any);
  }

  return {
    currentClient: () => new FakeClient(),
    Client: FakeClient,
  };
});

describe("Context.set", () => {
  function createDeliveryClient() {
    const waiters: Subject<void>[] = [];
    const sentMessages: unknown[] = [];
    const incomingMessage$ = new Subject<unknown>();
    const outcomingMessage$ = new Subject<unknown>();
    outcomingMessage$.subscribe((message) => sentMessages.push(message));

    const client = {
      destroy$: new Subject<void>(),
      outcomingMessage$,
      incomingMessage$,
      error$: { next: () => undefined },
      waitForDelivery: vi.fn(() => {
        const waiter = new Subject<void>();
        waiters.push(waiter);
        return waiter.asObservable();
      }),
    };

    return {
      client: client as unknown as Client,
      incomingMessage$,
      sentMessages,
      waiters,
    };
  }

  it("patch обновляет несколько полей за один next", async () => {
    type TestContext = {
      message: string;
      sending: boolean;
      count: number;
    };

    const ctx = new Context<TestContext>({
      data: async () => ({
        message: "draft",
        sending: true,
        count: 1,
      }),
    });

    await ctx.init();

    let emissions = 0;
    ctx.watch().subscribe(() => {
      emissions += 1;
    });

    ctx.set({
      message: "",
      sending: false,
      count: 2,
    });

    expect(ctx.get("message")).toBe("");
    expect(ctx.get("sending")).toBe(false);
    expect(ctx.get("count")).toBe(2);
    expect(emissions).toBe(2);
  });

  it("возвращает hot Observable и ждёт receipt клиента", async () => {
    const ctx = new Context<{ loading: boolean }>({
      data: async () => ({ loading: false }),
    });
    const recipient = createDeliveryClient();

    ctx.authorizeClient(recipient.client);
    await ctx.init();

    const result$ = ctx.set({ loading: true });

    expect(recipient.sentMessages).toHaveLength(1);
    expect(ctx.get("loading")).toBe(true);

    let nextCalls = 0;
    let completed = false;
    result$.subscribe({
      next: () => {
        nextCalls += 1;
      },
      complete: () => {
        completed = true;
      },
    });

    expect(nextCalls).toBe(0);
    expect(completed).toBe(false);

    recipient.waiters[0].next(undefined);
    recipient.waiters[0].complete();

    expect(nextCalls).toBe(1);
    expect(completed).toBe(true);
  });

  it("завершается только после receipt всех адресатов", async () => {
    const ctx = new Context<{ loading: boolean }>({
      data: async () => ({ loading: false }),
    });
    const first = createDeliveryClient();
    const second = createDeliveryClient();

    ctx.authorizeClient(first.client);
    ctx.authorizeClient(second.client);
    await ctx.init();

    const result$ = ctx.set({ loading: true });
    let nextCalls = 0;
    let completed = false;
    result$.subscribe({
      next: () => {
        nextCalls += 1;
      },
      complete: () => {
        completed = true;
      },
    });

    expect(first.sentMessages).toHaveLength(1);
    expect(second.sentMessages).toHaveLength(1);

    first.waiters[0].next(undefined);
    first.waiters[0].complete();

    expect(nextCalls).toBe(0);
    expect(completed).toBe(false);

    second.waiters[0].next(undefined);
    second.waiters[0].complete();

    expect(nextCalls).toBe(1);
    expect(completed).toBe(true);
  });

  it("patch применяет явный undefined по hasOwnProperty", async () => {
    type TestContext = {
      flag?: boolean;
      label: string;
    };

    const ctx = new Context<TestContext>({
      data: async () => ({
        flag: true,
        label: "keep",
      }),
    });

    await ctx.init();

    ctx.set({
      flag: undefined,
      label: "changed",
    });

    expect(ctx.get("flag")).toBeUndefined();
    expect(ctx.get("label")).toBe("changed");
  });

  it("patch с одним ключом обновляет одно поле", async () => {
    type TestContext = { loading: boolean };

    const ctx = new Context<TestContext>({
      data: async () => ({ loading: false }),
    });

    await ctx.init();
    ctx.set({ loading: true });
    expect(ctx.get("loading")).toBe(true);
  });

  it("patch типизирует вложенные пути", async () => {
    type TestContext = {
      user: { name: string };
    };

    const ctx = new Context<TestContext>({
      data: async () => ({
        user: { name: "Alice" },
      }),
    });

    await ctx.init();

    ctx.set({
      "user.name": "Bob",
    });

    expect(ctx.get("user.name")).toBe("Bob");
  });

  it("при пустом diff эмитит один success и не шлёт context-values", async () => {
    const ctx = new Context<{ loading: boolean }>({
      data: async () => ({ loading: false }),
    });
    const recipient = createDeliveryClient();

    ctx.authorizeClient(recipient.client);
    await ctx.init();

    let nextCalls = 0;
    let completed = false;
    ctx.set({ loading: false }).subscribe({
      next: () => {
        nextCalls += 1;
      },
      complete: () => {
        completed = true;
      },
    });

    expect(nextCalls).toBe(1);
    expect(completed).toBe(true);
    expect(recipient.sentMessages).toHaveLength(0);
    expect(recipient.waiters).toHaveLength(0);
  });

  it("при отсутствии адресатов сразу завершается и не ждёт receipt", async () => {
    const ctx = new Context<{ loading: boolean }>({
      data: async () => ({ loading: false }),
    });

    await ctx.init();

    let nextCalls = 0;
    let completed = false;
    ctx.set({ loading: true }).subscribe({
      next: () => {
        nextCalls += 1;
      },
      complete: () => {
        completed = true;
      },
    });

    expect(ctx.get("loading")).toBe(true);
    expect(nextCalls).toBe(1);
    expect(completed).toBe(true);
  });

  it("client-originated update шлёт diff только другим клиентам и без дубля", async () => {
    const ctx = new Context<{ loading: boolean }>({
      data: async () => ({ loading: false }),
    });
    const source = createDeliveryClient();
    const recipient = createDeliveryClient();

    ctx.authorizeClient(source.client);
    ctx.authorizeClient(recipient.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "loading", value: true },
      ]),
    );

    expect(ctx.get("loading")).toBe(true);
    expect(source.sentMessages).toHaveLength(0);
    expect(recipient.sentMessages).toHaveLength(1);
    expect(recipient.waiters).toHaveLength(1);
  });
});
