import { AppPageMessage } from "@matreshka/shared/messages/bff-to-client/app/app-page-message";
import { ClientToBffMessageReceivedMessage } from "@matreshka/shared/messages/client-to-bff/message-received-message";
import type { ClientState } from "@matreshka/shared/types/client-state";
import { filter, map, Observable, switchMap, take } from "rxjs";
import { Client } from "../../core";

export function hasRouteVisitedAt(
  state: ClientState | undefined,
): state is ClientState {
  return typeof state?.route?.visitedAt === "number";
}

/** `visitedAt` до команды — от него отличаем следующую навигацию клиента. */
export function baselineVisitedAt$(client: Client): Observable<number> {
  const current = client.state$.getValue();
  if (hasRouteVisitedAt(current)) {
    return new Observable((subscriber) => {
      subscriber.next(current.route.visitedAt);
      subscriber.complete();
    });
  }
  return client.state$.pipe(
    filter(hasRouteVisitedAt),
    take(1),
    map((state) => state.route.visitedAt),
  );
}

function waitForPageReceipt(
  client: Client,
  pageMessage: AppPageMessage,
): Observable<void> {
  return client.incomingMessage$.pipe(
    filter(
      (message): message is ClientToBffMessageReceivedMessage =>
        message instanceof ClientToBffMessageReceivedMessage &&
        message.payload.id === pageMessage.id,
    ),
    take(1),
    map(() => undefined),
  );
}

/**
 * После смены `route.visitedAt` относительно baseline — первый {@link AppPageMessage} и receipt.
 * Эмитит {@link ClientState} на новом route (для navigate: проверка path).
 */
export function waitForRouteChangeAndPageReceipt(
  client: Client,
  baselineVisitedAt: number,
): Observable<ClientState> {
  return client.state$.pipe(
    filter(
      (state) =>
        hasRouteVisitedAt(state) && state.route.visitedAt !== baselineVisitedAt,
    ),
    take(1),
    switchMap((state) =>
      client.outcomingMessage$.pipe(
        filter(
          (message): message is AppPageMessage =>
            message instanceof AppPageMessage,
        ),
        take(1),
        switchMap((pageMessage) =>
          waitForPageReceipt(client, pageMessage).pipe(map(() => state)),
        ),
      ),
    ),
  );
}
