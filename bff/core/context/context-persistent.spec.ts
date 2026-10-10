import {
  ContextDestroyMessage,
  ContextInitMessage,
} from "@matreshka/shared/messages/bff-to-client/context/index";
import { Subject } from "rxjs";
import { describe, expect, it } from "vitest";
import { Context } from "./context";

type TestData = { name: string };

function createMockClient() {
  return {
    destroy$: new Subject<void>(),
    incomingMessage$: new Subject<unknown>(),
    outcomingMessage$: new Subject<unknown>(),
    error$: { next: () => {} },
  } as any;
}

describe("Context persistent", () => {
  it("по умолчанию уничтожается при destroy$ последнего клиента", async () => {
    const client = createMockClient();
    const context = new Context<TestData>({
      data: async () => ({ name: "a" }),
    });

    context.authorizeClient(client);
    await context.init();

    client.destroy$.next();
    expect(context.isDestroyed()).toBe(true);
  });

  it("persistent: остаётся жив после ухода последнего клиента", async () => {
    const client = createMockClient();
    const outMessages: unknown[] = [];
    client.outcomingMessage$.subscribe((message) => outMessages.push(message));

    const context = new Context<TestData>({
      persistent: true,
      data: async () => ({ name: "cached" }),
    });

    context.authorizeClient(client);
    await context.init();

    client.destroy$.next();

    expect(context.isDestroyed()).toBe(false);
    expect(context.persistent).toBe(true);
    expect(context.value("name")).toBe("cached");
    expect(outMessages.some((m) => m instanceof ContextDestroyMessage)).toBe(
      true,
    );
  });

  it("persistent: новый клиент получает context-init после ухода предыдущего", async () => {
    const first = createMockClient();
    const context = new Context<TestData>({
      persistent: true,
      preload: true,
      data: async () => ({ name: "shared" }),
    });

    context.authorizeClient(first);
    await context.init();
    first.destroy$.next();

    const second = createMockClient();
    const outMessages: unknown[] = [];
    second.outcomingMessage$.subscribe((message) => outMessages.push(message));

    context.authorizeClient(second);
    await context.init();

    expect(context.value("name")).toBe("shared");
    expect(outMessages.some((m) => m instanceof ContextInitMessage)).toBe(true);
  });

  it("persistent: явный destroy() после unbind всех клиентов", async () => {
    const client = createMockClient();
    const context = new Context<TestData>({
      persistent: true,
      data: async () => ({ name: "x" }),
    });

    context.authorizeClient(client);
    await context.init();
    client.destroy$.next();

    context.destroy();
    expect(context.isDestroyed()).toBe(true);
  });

  it("два клиента: после ухода обоих default контекст уничтожен, persistent жив", async () => {
    const defaultContext = new Context<TestData>({
      data: async () => ({ name: "d" }),
    });
    const persistentContext = new Context<TestData>({
      persistent: true,
      data: async () => ({ name: "p" }),
    });

    const c1 = createMockClient();
    const c2 = createMockClient();
    defaultContext.authorizeClient(c1);
    persistentContext.authorizeClient(c1);
    await defaultContext.init();
    await persistentContext.init();

    const c3 = createMockClient();
    defaultContext.authorizeClient(c3);
    persistentContext.authorizeClient(c3);

    c1.destroy$.next();
    c3.destroy$.next();

    expect(defaultContext.isDestroyed()).toBe(true);
    expect(persistentContext.isDestroyed()).toBe(false);
    expect(persistentContext.value("name")).toBe("p");
  });
});
