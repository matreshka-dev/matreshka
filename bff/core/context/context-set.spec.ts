import { ContextValuesMessage as ClientToBffContextValuesMessage } from "@matreshka/client-bff-protocol/messages/client-to-bff/context/index";
import { BehaviorSubject, Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { z, ZodError } from "zod";
import type { Client } from "../client";
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

async function flushClientMessageHandling() {
  await new Promise<void>((resolve) => {
    queueMicrotask(() => resolve());
  });
  await new Promise<void>((resolve) => {
    queueMicrotask(() => resolve());
  });
}

describe("Context.set", () => {
  function createDeliveryClient() {
    const waiters: Subject<void>[] = [];
    const sentMessages: unknown[] = [];
    const errors: unknown[] = [];
    const incomingMessage$ = new Subject<unknown>();
    const outcomingMessage$ = new Subject<unknown>();
    outcomingMessage$.subscribe((message) => sentMessages.push(message));

    const client = {
      destroy$: new Subject<void>(),
      outcomingMessage$,
      incomingMessage$,
      error$: { next: (error: unknown) => errors.push(error) },
      waitForDelivery: vi.fn(() => {
        const waiter = new Subject<void>();
        waiters.push(waiter);
        return waiter.asObservable();
      }),
    };

    return {
      client: client as unknown as Client,
      incomingMessage$,
      sentMessages,
      waiters,
      errors,
    };
  }

  it("patch обновляет несколько полей за один next", async () => {
    type TestContext = {
      message: string;
      sending: boolean;
      count: number;
    };

    const ctx = createContext<TestContext>({
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

  it("возвращает hot Observable и ждёт receipt клиента", async () => {
    const ctx = createContext<{ loading: boolean }>({
      data: async () => ({ loading: false }),
    });
    const recipient = createDeliveryClient();

    ctx.authorizeClient(recipient.client);
    await ctx.init();

    const result$ = ctx.set({ loading: true });

    expect(recipient.sentMessages).toHaveLength(1);
    expect(ctx.get("loading")).toBe(true);

    const snapshots: Client[][] = [];
    let completed = false;
    result$.subscribe({
      next: (progress) => {
        snapshots.push(progress.delivered);
      },
      complete: () => {
        completed = true;
      },
    });

    expect(snapshots).toHaveLength(0);
    expect(completed).toBe(false);

    recipient.waiters[0].next(undefined);
    recipient.waiters[0].complete();

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual([recipient.client]);
    expect(completed).toBe(true);
  });

  it("завершается только после receipt всех адресатов", async () => {
    const ctx = createContext<{ loading: boolean }>({
      data: async () => ({ loading: false }),
    });
    const first = createDeliveryClient();
    const second = createDeliveryClient();

    ctx.authorizeClient(first.client);
    ctx.authorizeClient(second.client);
    await ctx.init();

    const result$ = ctx.set({ loading: true });
    const snapshots: Client[][] = [];
    let completed = false;
    result$.subscribe({
      next: (progress) => {
        snapshots.push(progress.delivered);
      },
      complete: () => {
        completed = true;
      },
    });

    expect(first.sentMessages).toHaveLength(1);
    expect(second.sentMessages).toHaveLength(1);

    first.waiters[0].next(undefined);
    first.waiters[0].complete();

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual([first.client]);
    expect(completed).toBe(false);

    second.waiters[0].next(undefined);
    second.waiters[0].complete();

    expect(snapshots).toHaveLength(2);
    expect(snapshots[1]).toEqual([first.client, second.client]);
    expect(completed).toBe(true);
  });

  it("patch применяет явный undefined по hasOwnProperty", async () => {
    type TestContext = {
      flag?: boolean;
      label: string;
    };

    const ctx = createContext<TestContext>({
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

    const ctx = createContext<TestContext>({
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

    const ctx = createContext<TestContext>({
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

  it("при пустом diff эмитит один success и не шлёт context-values", async () => {
    const ctx = createContext<{ loading: boolean }>({
      data: async () => ({ loading: false }),
    });
    const recipient = createDeliveryClient();

    ctx.authorizeClient(recipient.client);
    await ctx.init();

    let lastDelivery: { delivered: Client[] } | undefined;
    let completed = false;
    ctx.set({ loading: false }).subscribe({
      next: (progress) => {
        lastDelivery = progress;
      },
      complete: () => {
        completed = true;
      },
    });

    expect(lastDelivery?.delivered).toEqual([]);
    expect(completed).toBe(true);
    expect(recipient.sentMessages).toHaveLength(0);
    expect(recipient.waiters).toHaveLength(0);
  });

  it("при отсутствии адресатов сразу завершается и не ждёт receipt", async () => {
    const ctx = createContext<{ loading: boolean }>({
      data: async () => ({ loading: false }),
    });

    await ctx.init();

    let lastDelivery: { delivered: Client[] } | undefined;
    let completed = false;
    ctx.set({ loading: true }).subscribe({
      next: (progress) => {
        lastDelivery = progress;
      },
      complete: () => {
        completed = true;
      },
    });

    expect(ctx.get("loading")).toBe(true);
    expect(lastDelivery?.delivered).toEqual([]);
    expect(completed).toBe(true);
  });

  it("client-originated update шлёт diff только другим клиентам и без дубля", async () => {
    const ctx = createContext({
      schema: z.object({ loading: z.boolean() }),
      data: async () => ({ loading: false as boolean }),
    });
    const source = createDeliveryClient();
    const recipient = createDeliveryClient();

    ctx.authorizeClient(source.client);
    ctx.authorizeClient(recipient.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "loading", value: true },
      ]),
    );
    await flushClientMessageHandling();

    expect(ctx.get("loading")).toBe(true);
    expect(source.sentMessages).toHaveLength(0);
    expect(recipient.sentMessages).toHaveLength(1);
    expect(recipient.waiters).toHaveLength(1);
    expect(source.errors).toEqual([]);
  });

  it("client update без schema уходит в error$ и не меняет данные", async () => {
    const ctx = createContext<{ loading: boolean }>({
      data: async () => ({ loading: false }),
    });
    const source = createDeliveryClient();

    ctx.authorizeClient(source.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "loading", value: true },
      ]),
    );
    await flushClientMessageHandling();

    expect(ctx.get("loading")).toBe(false);
    expect(source.errors).toHaveLength(1);
    expect(source.errors[0]).toBeInstanceOf(Error);
    expect(source.errors[0]).not.toBeInstanceOf(ZodError);
    expect((source.errors[0] as Error).message).toContain(
      "validation schema is not set",
    );
    expect(source.sentMessages).toHaveLength(0);
  });

  it("ключ вне schema отклоняется целиком, даже если рядом валидное поле", async () => {
    const ctx = createContext({
      schema: z.object({ name: z.string() }),
      data: async () => ({ name: "", role: "viewer" as string }),
    });
    const source = createDeliveryClient();

    ctx.authorizeClient(source.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "name", value: "Анна" },
        { key: "role", value: "admin" },
      ]),
    );
    await flushClientMessageHandling();

    expect(ctx.get("name")).toBe("");
    expect(ctx.get("role")).toBe("viewer");
    expect(source.errors).toHaveLength(1);
    expect(source.errors[0]).toBeInstanceOf(Error);
    expect(source.errors[0]).not.toBeInstanceOf(ZodError);
    expect((source.errors[0] as Error).message).toContain(
      'client update for "role": key is not described in the validation schema',
    );
  });

  it("применяет результат Zod parse (transform) в контекст", async () => {
    const ctx = createContext({
      schema: z.object({
        name: z.string().transform((value) => value.trim()),
      }),
      data: async () => ({ name: "" as string }),
    });
    const source = createDeliveryClient();

    ctx.authorizeClient(source.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "name", value: "  Анна  " },
      ]),
    );
    await flushClientMessageHandling();

    expect(ctx.get("name")).toBe("Анна");
    expect(source.errors).toEqual([]);
  });

  it("object-level transform в schema отклоняется при создании контекста", () => {
    expect(() =>
      createContext({
        schema: z.object({
          user: z
            .object({
              firstName: z.string(),
              lastName: z.string(),
            })
            .transform((user) => ({
              fullName: `${user.firstName} ${user.lastName}`,
            })),
        }),
        data: async () => ({
          user: { firstName: "A", lastName: "B" },
        }),
      }),
    ).toThrow(/object-level transform/);
  });

  it("явный undefined для обязательного поля отклоняется", async () => {
    const ctx = createContext({
      schema: z.object({ name: z.string() }),
      data: async () => ({ name: "keep" as string }),
    });
    const source = createDeliveryClient();

    ctx.authorizeClient(source.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "name", value: undefined },
      ]),
    );
    await flushClientMessageHandling();

    expect(ctx.get("name")).toBe("keep");
    expect(source.errors[0]).toBeInstanceOf(ZodError);
  });

  it("отклоняет опасный сегмент пути", async () => {
    const ctx = createContext({
      schema: z.object({ name: z.string() }),
      data: async () => ({ name: "" as string }),
    });
    const source = createDeliveryClient();

    ctx.authorizeClient(source.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "__proto__.x", value: "y" },
      ]),
    );
    await flushClientMessageHandling();

    expect(ctx.get("name")).toBe("");
    expect(source.errors[0]).toBeInstanceOf(Error);
    expect((source.errors[0] as Error).message).toContain(
      "Invalid context path",
    );
  });

  it("пересекающиеся пути в одном context-values отклоняются", async () => {
    const ctx = createContext({
      schema: z.object({
        user: z.object({ name: z.string() }),
      }),
      data: async () => ({ user: { name: "" } }),
    });
    const source = createDeliveryClient();

    ctx.authorizeClient(source.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "user", value: { name: "John" } },
        { key: "user.name", value: "Mike" },
      ]),
    );
    await flushClientMessageHandling();

    expect(ctx.get("user.name")).toBe("");
    expect(source.errors).toHaveLength(1);
    expect((source.errors[0] as Error).message).toContain(
      "Overlapping context paths",
    );
  });

  it("client update по dotted-пути применяет transform вложенного поля", async () => {
    type UserContext = {
      profile: { name: string; age: number };
    };

    const ctx = createContext({
      schema: z.object({
        profile: z.object({
          age: z.string().transform((value) => Number(value)),
        }),
      }),
      data: async (): Promise<UserContext> => ({
        profile: { name: "", age: 0 },
      }),
    });
    const source = createDeliveryClient();

    ctx.authorizeClient(source.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "profile.age", value: "25" },
      ]),
    );
    await flushClientMessageHandling();

    expect(ctx.get("profile.age")).toBe(25);
    expect(typeof ctx.get("profile.age")).toBe("number");
    expect(source.errors).toEqual([]);
  });

  it("client update по числовому сегменту массива проходит схему", async () => {
    const ctx = createContext({
      schema: z.object({
        meters: z.array(
          z.object({
            zones: z.array(
              z.object({
                value: z.string(),
              }),
            ),
          }),
        ),
      }),
      data: async () => ({
        meters: [{ id: 10, zones: [{ code: "T1", value: "" }] }],
      }),
    });
    const source = createDeliveryClient();

    ctx.authorizeClient(source.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "meters.0.zones.0.value", value: "2" },
      ]),
    );
    await flushClientMessageHandling();

    expect(ctx.get("meters.0.zones.0.value")).toBe("2");
    expect(source.errors).toEqual([]);
  });

  it("значение не того типа остаётся ZodError и не попадает в контекст", async () => {
    const ctx = createContext({
      schema: z.object({ name: z.string() }),
      data: async () => ({ name: "" as string }),
    });
    const source = createDeliveryClient();

    ctx.authorizeClient(source.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "name", value: 123 },
      ]),
    );
    await flushClientMessageHandling();

    expect(ctx.get("name")).toBe("");
    expect(source.errors[0]).toBeInstanceOf(ZodError);
  });
});
