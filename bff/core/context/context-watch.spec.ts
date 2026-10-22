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

describe("Context.watch", () => {
  type TestContext = { count: number };

  it("эмитит текущее значение при subscribe и следующие обновления", async () => {
    const ctx = new Context<TestContext>({
      data: async () => ({ count: 1 }),
    });

    await ctx.init();

    const values: number[] = [];
    ctx.watch().subscribe((data) => {
      values.push(data.count);
    });

    ctx.set({ count: 2 });

    expect(values).toEqual([1, 2]);
  });

  it("ждёт init и затем эмитит данные", async () => {
    const ctx = new Context<TestContext>({
      data: async () => ({ count: 5 }),
    });

    const values: number[] = [];
    ctx.watch().subscribe((data) => {
      values.push(data.count);
    });

    await ctx.init();

    expect(values).toEqual([5]);
  });

  it("завершает поток без эмиссий, если destroy до init", () => {
    const ctx = new Context<TestContext>({
      data: async () => new Promise(() => {}),
    });

    let completed = false;
    ctx.watch().subscribe({
      complete: () => {
        completed = true;
      },
    });

    ctx.destroy();

    expect(completed).toBe(true);
  });
});
