import { ContextInitMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/context/index";
import { Subject } from "rxjs";
import { describe, expect, it } from "vitest";
import { Context } from "./context";

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("Context preload", () => {
  it("не шлёт context-init отключившемуся клиенту после медленного init", async () => {
    const client = {
      destroy$: new Subject<void>(),
      incomingMessage$: new Subject<unknown>(),
      outcomingMessage$: new Subject<unknown>(),
      error$: { next: () => {} },
    };
    const sent: unknown[] = [];
    client.outcomingMessage$.subscribe((message) => sent.push(message));

    const context = new Context<{ name: string }>({
      preload: true,
      persistent: true,
      data: async () => {
        await sleep(40);
        return { name: "loaded" };
      },
    });

    context.authorizeClient(client as any);
    client.destroy$.next(undefined);
    await sleep(60);

    expect(
      sent.filter((message) => message instanceof ContextInitMessage),
    ).toEqual([]);
    expect(context.isDestroyed()).toBe(false);
  });
});
