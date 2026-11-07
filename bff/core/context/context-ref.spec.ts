import { BehaviorSubject, Subject } from "rxjs";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import type { Client } from "../client";
import { createContext } from "./context";
import { ContextRef } from "./context-ref";

// Переопределяем currentClient до объявления любых зависимостей, чтобы Context.toJSON/ContextRef.toJSON не падали
vi.mock("../client", () => {
  class FakeClient {
    destroy$ = new BehaviorSubject<void>(undefined);
    outcomingMessage$ = new BehaviorSubject<any>(null as any);
    incomingMessage$ = new BehaviorSubject<any>(null as any);
    error$ = new BehaviorSubject<any>(null as any);
  }

  const client = new FakeClient();

  return {
    currentClient: () => client,
    Client: FakeClient,
  };
});

describe("Context.ref и ContextRef.ref", () => {
  it("должен давать local-методы только для writable ref", () => {
    type TestContext = {
      count: number;
      flag: boolean;
      title: string;
    };

    const ctx = createContext({
      data: async (): Promise<TestContext> => ({
        count: 1,
        flag: false,
        title: "A",
      }),
      schema: z.object({
        count: z.number(),
        flag: z.boolean(),
      }),
    });

    const countRef = ctx.ref("count");
    const flagRef = ctx.ref("flag");
    const titleRef = ctx.ref("title");

    expectTypeOf(countRef.local.set).toBeFunction();
    expectTypeOf(countRef.local.inc).toBeFunction();
    expectTypeOf(countRef.local.dec).toBeFunction();
    expectTypeOf(flagRef.local.set).toBeFunction();
    expectTypeOf(flagRef.local.toggle).toBeFunction();
    expectTypeOf(titleRef.local).not.toHaveProperty("set");
    expectTypeOf(titleRef.local).not.toHaveProperty("inc");
    expectTypeOf(titleRef.local).not.toHaveProperty("toggle");
  });

  it("должны строить простой путь внутри одного контекста", async () => {
    const ctx = createContext({
      data: async () => ({
        user: {
          profile: { name: "Alice" },
        },
      }),
    });

    await ctx.init();

    const ref = ctx.ref("user").ref("profile").ref("name");

    expect(ref.path).toBe("user.profile.name");
    expect(ref.get()).toBe("Alice");
  });

  it("должен уметь продолжать путь через другой ContextRef того же контекста", async () => {
    type TestContext = {
      user: {
        profile: { name: string };
      };
    };

    const ctx = createContext<TestContext>({
      data: async () => ({
        user: {
          profile: { name: "Bob" },
        },
      }),
    });

    await ctx.init();

    const base = ctx.ref("user");
    const suffix = new ContextRef<TestContext, "profile.name">(
      ctx,
      "profile.name",
    );

    const combined = base.ref(suffix);

    expect(combined.path).toBe("user.profile.name");
    expect(combined.get()).toBe("Bob");
  });

  it("ContextRef.set должен записывать значение по пути ref", async () => {
    type TestContext = {
      user: { name: string };
      loading: boolean;
    };

    const ctx = createContext<TestContext>({
      data: async () => ({
        user: { name: "Alice" },
        loading: false,
      }),
    });

    await ctx.init();

    const nameRef = ctx.ref("user").ref("name");
    let nextCalls = 0;
    let completed = false;
    nameRef.set("Carol").subscribe({
      next: () => {
        nextCalls += 1;
      },
      complete: () => {
        completed = true;
      },
    });
    expect(nameRef.get()).toBe("Carol");
    expect(nextCalls).toBe(1);
    expect(completed).toBe(true);

    const loadingRef = ctx.ref("loading");
    loadingRef.set(true);
    expect(loadingRef.get()).toBe(true);
  });

  it("ContextRef.set после destroy бросает ту же ошибку, что Context.set", async () => {
    const ctx = createContext<{ flag: boolean }>({
      data: async () => ({ flag: false }),
    });

    await ctx.init();

    const flagRef = ctx.ref("flag");
    ctx.destroy();

    expect(() => flagRef.set(true)).toThrow(/has been destroyed/);
  });

  it("ContextRef.set ждёт receipt так же, как Context.set", async () => {
    const waiters: Subject<void>[] = [];
    const sentMessages: unknown[] = [];
    const outcomingMessage$ = new Subject<unknown>();
    outcomingMessage$.subscribe((message) => sentMessages.push(message));
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
    } as unknown as Client;

    const ctx = createContext<{ flag: boolean }>({
      data: async () => ({ flag: false }),
    });
    ctx.authorizeClient(client);
    await ctx.init();

    let lastDelivery: { delivered: Client[] } | undefined;
    let completed = false;
    ctx
      .ref("flag")
      .set(true)
      .subscribe({
        next: (progress) => {
          lastDelivery = progress;
        },
        complete: () => {
          completed = true;
        },
      });

    expect(ctx.get("flag")).toBe(true);
    expect(sentMessages).toHaveLength(1);
    expect(lastDelivery).toBeUndefined();
    expect(completed).toBe(false);

    waiters[0].next(undefined);
    waiters[0].complete();

    expect(lastDelivery?.delivered).toEqual([client]);
    expect(completed).toBe(true);
  });
});

describe("Context.strictRef", () => {
  it("должен использовать строковый путь из другого контекста", async () => {
    type CardsContext = {
      cards: { balance: number }[];
    };

    type PathContext = {
      path: string;
    };

    const cardsContext = createContext<CardsContext>({
      data: async () => ({
        cards: [{ balance: 100 }, { balance: 200 }],
      }),
    });

    const pathContext = createContext<PathContext>({
      data: async () => ({
        path: "cards.1.balance",
      }),
    });

    await Promise.all([cardsContext.init(), pathContext.init()]);

    const pathRef = pathContext.ref("path");

    const resultRef = cardsContext.strictRef(pathRef);

    expect(resultRef.path).toBe(pathRef.toString());
    expect(resultRef.get()).toBe(200);
  });

  it("должен корректно работать, если значение пути изменилось", async () => {
    type CardsContext = {
      cards: { balance: number }[];
    };

    type PathContext = {
      path: string;
    };

    const cardsContext = createContext<CardsContext>({
      data: async () => ({
        cards: [{ balance: 100 }, { balance: 200 }],
      }),
    });

    const pathContext = createContext<PathContext>({
      data: async () => ({
        path: "cards.0.balance",
      }),
    });

    await Promise.all([cardsContext.init(), pathContext.init()]);

    const pathRef = pathContext.ref("path");

    const resultRef1 = cardsContext.strictRef(pathRef);
    expect(resultRef1.get()).toBe(100);

    // изменяем путь во втором контексте
    pathContext.set({ path: "cards.1.balance" });

    const resultRef2 = cardsContext.strictRef(pathRef);
    expect(resultRef2.get()).toBe(200);
  });
});
