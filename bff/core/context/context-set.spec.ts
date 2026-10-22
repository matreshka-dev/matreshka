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

describe("Context.set", () => {
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
});
