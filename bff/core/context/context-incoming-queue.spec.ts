import { ContextValuesMessage as ClientToBffContextValuesMessage } from "@matreshka/client-bff-protocol/messages/client-to-bff/context/index";
import { Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Client } from "../client";
import { createContext } from "./context";

vi.mock("../client", () => {
  class FakeClient {
    destroy$ = new Subject<void>();
    outcomingMessage$ = new Subject<unknown>();
    incomingMessage$ = new Subject<unknown>();
    error$ = new Subject<unknown>();
  }

  return {
    currentClient: () => new FakeClient(),
    Client: FakeClient,
  };
});

function createDeliveryClient() {
  const sentMessages: unknown[] = [];
  const errors: unknown[] = [];
  const incomingMessage$ = new Subject<unknown>();
  const outcomingMessage$ = new Subject<unknown>();
  outcomingMessage$.subscribe((message) => sentMessages.push(message));
  const destroy$ = new Subject<void>();

  const client = {
    destroy$,
    outcomingMessage$,
    incomingMessage$,
    error$: { next: (error: unknown) => errors.push(error) },
    waitForDelivery: vi.fn(),
  };

  return {
    client: client as unknown as Client,
    incomingMessage$,
    destroy$,
    sentMessages,
    errors,
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("Context incoming message queue", () => {
  it("обрабатывает сообщения разных клиентов в порядке поступления в очередь", async () => {
    const applyOrder: string[] = [];

    const ctx = createContext({
      schema: z.object({
        name: z.string().transform(async (value) => {
          if (value === "slow") {
            await sleep(40);
          } else {
            await sleep(5);
          }
          applyOrder.push(value);
          return value;
        }),
      }),
      data: async () => ({ name: "" }),
    });

    const slow = createDeliveryClient();
    const fast = createDeliveryClient();
    ctx.authorizeClient(slow.client);
    ctx.authorizeClient(fast.client);
    await ctx.init();

    slow.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "name", value: "slow" },
      ]),
    );
    fast.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "name", value: "fast" },
      ]),
    );

    await sleep(60);

    expect(applyOrder).toEqual(["slow", "fast"]);
    expect(ctx.get("name")).toBe("fast");
  });

  it("не применяет patch после отвязки клиента во время async-валидации", async () => {
    const ctx = createContext({
      persistent: true,
      schema: z.object({
        name: z.string().transform(async (value) => {
          await sleep(30);
          return value;
        }),
      }),
      data: async () => ({ name: "keep" }),
    });

    const source = createDeliveryClient();
    ctx.authorizeClient(source.client);
    await ctx.init();

    source.incomingMessage$.next(
      new ClientToBffContextValuesMessage(ctx.id, [
        { key: "name", value: "new" },
      ]),
    );
    source.destroy$.next(undefined);
    await sleep(50);

    expect(ctx.get("name")).toBe("keep");
  });
});
