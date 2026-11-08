import { BehaviorSubject, Subject } from "rxjs";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { Client } from "../client";
import { Context, createContext } from "./context";

vi.mock("../client", () => {
  class FakeClient {
    destroy$ = new BehaviorSubject<void>(undefined);
    outcomingMessage$ = new BehaviorSubject<any>(null as any);
    incomingMessage$ = new BehaviorSubject<any>(null as any);
    error$ = new BehaviorSubject<any>(null as any);
  }

  return {
    currentClient: () => new FakeClient(),
    Client: FakeClient,
  };
});

describe("Context.update", () => {
  type TestContext = {
    message: string;
    count: number;
    items: string[];
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

  it("считает следующее состояние из текущего снимка", async () => {
    const ctx = createContext<TestContext>({
      data: async () => ({ message: "old", count: 1, items: ["a"] }),
    });

    await ctx.init();

    expectTypeOf<Parameters<Context<TestContext>["update"]>[0]>().toEqualTypeOf<
      (current: TestContext) => TestContext
    >();

    ctx.update((current) => ({
      ...current,
      message: `${current.message}!`,
      count: current.count + 1,
      items: [...current.items, "b"],
    }));

    expect(ctx.get("message")).toBe("old!");
    expect(ctx.get("count")).toBe(2);
    expect(ctx.get("items")).toEqual(["a", "b"]);
  });

  it("применяет in-place правку копии и отсоединяет её от хранилища", async () => {
    const ctx = createContext<TestContext>({
      data: async () => ({ message: "old", count: 1, items: ["a"] }),
    });

    await ctx.init();

    let held: TestContext | undefined;
    ctx.update((current) => {
      current.count += 1;
      current.items.push("b");
      held = current;
      return current;
    });

    expect(ctx.get("count")).toBe(2);
    expect(ctx.get("items")).toEqual(["a", "b"]);

    held!.count = 99;
    held!.items.push("c");

    expect(ctx.get("count")).toBe(2);
    expect(ctx.get("items")).toEqual(["a", "b"]);
  });

  it("возвращает Observable, который завершается после receipt", async () => {
    const ctx = createContext<TestContext>({
      data: async () => ({ message: "old", count: 1, items: ["a"] }),
    });
    const recipient = createDeliveryClient();

    ctx.authorizeClient(recipient.client);
    await ctx.init();

    const result$ = ctx.update((current) => ({
      ...current,
      count: current.count + 1,
    }));
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
    const ctx = createContext<TestContext>({
      data: async () => ({ message: "", count: 0, items: [] }),
    });

    expect(() => ctx.update((current) => current)).toThrow(/not initialized/);
  });

  it("бросает, если контекст уничтожен", async () => {
    const ctx = createContext<TestContext>({
      data: async () => ({ message: "", count: 0, items: [] }),
    });

    await ctx.init();
    ctx.destroy();

    expect(() => ctx.update((current) => current)).toThrow(
      /has been destroyed/,
    );
  });
});
