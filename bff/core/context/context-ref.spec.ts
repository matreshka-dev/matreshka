import { BehaviorSubject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { Context } from "./context";
import { ContextRef } from "./context-ref";

// Переопределяем currentClient до объявления любых зависимостей, чтобы Context.toJSON/ContextRef.toJSON не падали
vi.mock("../client", () => {
  class FakeClient {
    destroy$ = new BehaviorSubject<void>(undefined as any);
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
  it("должны строить простой путь внутри одного контекста", async () => {
    const ctx = new Context({
      data: async () => ({
        user: {
          profile: { name: "Alice" },
        },
      }),
    });

    await ctx.init();

    const ref = ctx.ref("user").ref("profile").ref("name");

    expect(ref.path).toBe("user.profile.name");
    expect(ref.value()).toBe("Alice");
  });

  it("должен уметь продолжать путь через другой ContextRef того же контекста", async () => {
    type TestContext = {
      user: {
        profile: { name: string };
      };
    };

    const ctx = new Context<TestContext>({
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
    expect(combined.value()).toBe("Bob");
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

    const cardsContext = new Context<CardsContext>({
      data: async () => ({
        cards: [{ balance: 100 }, { balance: 200 }],
      }),
    });

    const pathContext = new Context<PathContext>({
      data: async () => ({
        path: "cards.1.balance",
      }),
    });

    await Promise.all([cardsContext.init(), pathContext.init()]);

    const pathRef = pathContext.ref("path");

    const resultRef = cardsContext.strictRef(pathRef);

    expect(resultRef.path).toBe(pathRef.toString());
    expect(resultRef.value()).toBe(200);
  });

  it("должен корректно работать, если значение пути изменилось", async () => {
    type CardsContext = {
      cards: { balance: number }[];
    };

    type PathContext = {
      path: string;
    };

    const cardsContext = new Context<CardsContext>({
      data: async () => ({
        cards: [{ balance: 100 }, { balance: 200 }],
      }),
    });

    const pathContext = new Context<PathContext>({
      data: async () => ({
        path: "cards.0.balance",
      }),
    });

    await Promise.all([cardsContext.init(), pathContext.init()]);

    const pathRef = pathContext.ref("path");

    const resultRef1 = cardsContext.strictRef(pathRef);
    expect(resultRef1.value()).toBe(100);

    // изменяем путь во втором контексте
    pathContext.setValue("path", "cards.1.balance");

    const resultRef2 = cardsContext.strictRef(pathRef);
    expect(resultRef2.value()).toBe(200);
  });
});
