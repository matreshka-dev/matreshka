import { PlatformId } from "@matreshka/shared/enums/platform-id";
import { AppNavigateMessage } from "@matreshka/shared/messages/bff-to-client/app/app-navigate-message";
import { AppPageMessage } from "@matreshka/shared/messages/bff-to-client/app/app-page-message";
import { ClientToBffMessageReceivedMessage } from "@matreshka/shared/messages/client-to-bff/message-received-message";
import type { ClientState } from "@matreshka/shared/types/client-state";
import { BehaviorSubject, firstValueFrom, Subject, take } from "rxjs";
import { describe, expect, it } from "vitest";
import { Client } from "../../core";
import { clientNavigatePlatformAction } from "./client-navigate-platform-action";

function createClientStub(initialState: ClientState) {
  const client = {
    state$: new BehaviorSubject(initialState),
    outcomingMessage$: new Subject(),
    incomingMessage$: new Subject(),
    destroy$: new Subject<void>(),
  };
  return client as unknown as Client;
}

const baseState = (): ClientState => ({
  route: { visitedAt: 1, path: "home", query: {} },
  storage: {},
  language: "ru",
  userAgent: "test",
  prefersColorScheme: "light",
  platform: { id: PlatformId.Browser, payload: {} },
});

describe("clientNavigatePlatformAction", () => {
  it("возвращает routeMatched после смены route и receipt page", async () => {
    const client = createClientStub(baseState());
    const navigatePromise = firstValueFrom(
      client.outcomingMessage$.pipe(take(1)),
    );
    const resultPromise = firstValueFrom(
      clientNavigatePlatformAction(client, "profile"),
    );

    const navigate = (await navigatePromise) as AppNavigateMessage;
    expect(navigate.payload.path).toBe("profile");

    client.state$.next({
      ...baseState(),
      route: { visitedAt: 2, path: "profile", query: {} },
    });

    const page = new AppPageMessage({ id: "page-1" } as never);
    client.outcomingMessage$.next(page);
    client.incomingMessage$.next(
      new ClientToBffMessageReceivedMessage({ id: page.id, attempt: 1 }),
    );

    await expect(resultPromise).resolves.toEqual({ routeMatched: true });
  });

  it("routeMatched false при другом path", async () => {
    const client = createClientStub(baseState());
    const navigatePromise = firstValueFrom(
      client.outcomingMessage$.pipe(take(1)),
    );
    const resultPromise = firstValueFrom(
      clientNavigatePlatformAction(client, "profile"),
    );

    await navigatePromise;

    client.state$.next({
      ...baseState(),
      route: { visitedAt: 2, path: "login", query: {} },
    });

    const page = new AppPageMessage({ id: "page-2" } as never);
    client.outcomingMessage$.next(page);
    client.incomingMessage$.next(
      new ClientToBffMessageReceivedMessage({ id: page.id, attempt: 1 }),
    );

    await expect(resultPromise).resolves.toEqual({ routeMatched: false });
  });

  it("ошибка при destroy до завершения", async () => {
    const client = createClientStub(baseState());
    const navigatePromise = firstValueFrom(
      client.outcomingMessage$.pipe(take(1)),
    );
    const resultPromise = firstValueFrom(
      clientNavigatePlatformAction(client, "profile"),
    );

    await navigatePromise;
    client.destroy$.next();

    await expect(resultPromise).rejects.toThrow(
      "Client destroyed before navigate completed",
    );
  });
});
