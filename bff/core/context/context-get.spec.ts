import { BehaviorSubject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
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

describe("Context.get", () => {
  it("возвращает копию объекта и массива, мутация не попадает в контекст", async () => {
    type TestContext = {
      meta: { count: number };
      items: string[];
    };

    const ctx = new Context<TestContext>({
      data: async () => ({
        meta: { count: 1 },
        items: ["a"],
      }),
    });

    await ctx.init();

    const meta = ctx.get("meta");
    meta.count = 99;

    const items = ctx.get("items");
    items.push("b");

    expect(ctx.get("meta")).toEqual({ count: 1 });
    expect(ctx.get("items")).toEqual(["a"]);
  });
});
