import { BehaviorSubject } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { describe, expect, it, vi } from "vitest";
import { createContext } from "./context";

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
    const ctx = createContext({
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
    const ctx = createContext({
      data: async () => ({ count: 5 }),
    });

    const values: number[] = [];
    ctx.watch().subscribe((data) => {
      values.push(data.count);
    });

    await ctx.init();

    expect(values).toEqual([5]);
  });

  it("set() эмитит новую ссылку для distinctUntilChanged", async () => {
    type Nested = { profile: { name: string } };
    const ctx = createContext({
      data: async () => ({ profile: { name: "a" } }),
    });
    await ctx.init();

    const emissions: Nested[] = [];
    ctx
      .watch()
      .pipe(distinctUntilChanged())
      .subscribe((data) => {
        emissions.push(data);
      });

    ctx.set({ "profile.name": "b" });

    expect(emissions).toHaveLength(2);
    expect(emissions[0]).not.toBe(emissions[1]);
    expect(emissions[1]!.profile.name).toBe("b");
  });

  it("завершает поток без эмиссий, если destroy до init", () => {
    const ctx = createContext<TestContext>({
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
