import { PlatformId } from "@matreshka/shared/enums/platform-id";
import { AppBackMessage } from "@matreshka/shared/messages/bff-to-client/app/app-back-message";
import { AppPageMessage } from "@matreshka/shared/messages/bff-to-client/app/app-page-message";
import { ClientToBffMessageReceivedMessage } from "@matreshka/shared/messages/client-to-bff/message-received-message";
import type { ClientState } from "@matreshka/shared/types/client-state";
import { BehaviorSubject, firstValueFrom, Subject, take } from "rxjs";
import { describe, expect, it } from "vitest";
import { Client } from "../../core";
import { clientBackPlatformAction } from "./client-back-platform-action";

function createClientStub(initialState: ClientState) {
  return {
    state$: new BehaviorSubject(initialState),
    outcomingMessage$: new Subject(),
    incomingMessage$: new Subject(),
    destroy$: new Subject<void>(),
  } as unknown as Client;
}

const baseState = (): ClientState => ({
  route: { visitedAt: 1, path: "profile", query: {} },
  storage: {},
  language: "ru",
  userAgent: "test",
  prefersColorScheme: "light",
  platform: { id: PlatformId.Browser, payload: {} },
});

describe("clientBackPlatformAction", () => {
  it("завершается после смены route и receipt page", async () => {
    const client = createClientStub(baseState());
    const backPromise = firstValueFrom(client.outcomingMessage$.pipe(take(1)));
    const resultPromise = firstValueFrom(clientBackPlatformAction(client));

    expect(await backPromise).toBeInstanceOf(AppBackMessage);

    client.state$.next({
      ...baseState(),
      route: { visitedAt: 2, path: "home", query: {} },
    });

    const page = new AppPageMessage({ id: "page-1" } as never);
    client.outcomingMessage$.next(page);
    client.incomingMessage$.next(
      new ClientToBffMessageReceivedMessage({ id: page.id, attempt: 1 }),
    );

    await expect(resultPromise).resolves.toBeUndefined();
  });
});
