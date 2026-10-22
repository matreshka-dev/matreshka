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

describe("Context.replace", () => {
  type TestContext = {
    message: string;
    count: number;
  };

  it("подменяет весь снимок данных", async () => {
    const ctx = new Context<TestContext>({
      data: async () => ({ message: "old", count: 1 }),
    });

    await ctx.init();

    ctx.replace({ message: "new", count: 42 });

    expect(ctx.get("message")).toBe("new");
    expect(ctx.get("count")).toBe(42);
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
