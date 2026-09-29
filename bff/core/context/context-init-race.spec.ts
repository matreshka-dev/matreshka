import { Subject } from "rxjs";
import { describe, expect, it } from "vitest";
import { Context } from "./context";

type TestData = { name: string };

describe("Context.init race", () => {
  it("повторный init() ждёт initPromise, а не возвращается на пустом data$", async () => {
    let resolveLoad!: (value: TestData) => void;
    const loadPromise = new Promise<TestData>((resolve) => {
      resolveLoad = resolve;
    });

    const context = new Context<TestData>({
      data: () => loadPromise,
    });

    const first = context.init();
    const second = context.init();

    resolveLoad({ name: "unit-11206" });
    await Promise.all([first, second]);

    expect(context.value("name")).toBe("unit-11206");
  });

  it("destroy() во время init() не бросает и не оставляет unhandled rejection", async () => {
    let resolveLoad!: (value: TestData) => void;
    const loadPromise = new Promise<TestData>((resolve) => {
      resolveLoad = resolve;
    });

    const context = new Context<TestData>({
      data: () => loadPromise,
    });

    const initPromise = context.init();
    context.destroy();

    resolveLoad({ name: "lost" });
    await expect(initPromise).resolves.toBe(context);
    expect(context.isDestroyed()).toBe(true);
  });

  it("ошибка init() уходит в client.error$, а не в unhandledRejection", async () => {
    const errors: unknown[] = [];
    const client = {
      destroy$: new Subject<void>(),
      incomingMessage$: new Subject<unknown>(),
      outcomingMessage$: new Subject<unknown>(),
      error$: { next: (error: unknown) => errors.push(error) },
    } as any;

    const context = new Context<TestData>({
      data: () => Promise.reject(new Error("load failed")),
    });

    context.authorizeClient(client);

    await context.init().catch(() => {});

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(new Error("load failed"));
  });
});
