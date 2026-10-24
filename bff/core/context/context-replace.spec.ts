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

describe("Context.replace", () => {
  type TestContext = {
    message: string;
    count: number;
  };

  function createDeliveryClient() {
    const waiters: Subject<void>[] = [];
    const outcomingMessage$ = new Subject<unknown>();

    const client = {
      destroy$: new Subject<void>(),
      outcomingMessage$,
      incomingMessage$: new Subject<unknown>(),
      error$: { next: () => undefined },
      waitForDelivery: vi.fn(() => {
        const waiter = new Subject<void>();
        waiters.push(waiter);
        return waiter.asObservable();
      }),
    };

    return {
      client: client as unknown as Client,
      waiters,
    };
  }

  it("подменяет весь снимок данных", async () => {
    const ctx = new Context<TestContext>({
      data: async () => ({ message: "old", count: 1 }),
    });

    await ctx.init();

    ctx.replace({ message: "new", count: 42 });

    expect(ctx.get("message")).toBe("new");
    expect(ctx.get("count")).toBe(42);
  });

  it("возвращает Observable, который завершается после receipt", async () => {
    const ctx = new Context<TestContext>({
      data: async () => ({ message: "old", count: 1 }),
    });
    const recipient = createDeliveryClient();

    ctx.authorizeClient(recipient.client);
    await ctx.init();

    const result$ = ctx.replace({ message: "new", count: 42 });
    let lastDelivery: { delivered: Client[] } | undefined;
    let completed = false;
    result$.subscribe({
      next: (progress) => {
        lastDelivery = progress;
      },
      complete: () => {
        completed = true;
      },
    });

    expect(lastDelivery).toBeUndefined();
    expect(completed).toBe(false);

    recipient.waiters[0].next(undefined);
    recipient.waiters[0].complete();

    expect(lastDelivery?.delivered).toEqual([recipient.client]);
    expect(completed).toBe(true);
  });

  it("бросает, если контекст не инициализирован", () => {
    const ctx = new Context<TestContext>({
      data: async () => ({ message: "", count: 0 }),
    });

    expect(() => ctx.replace({ message: "x", count: 1 })).toThrow(
      /not initialized/,
    );
  });
});
