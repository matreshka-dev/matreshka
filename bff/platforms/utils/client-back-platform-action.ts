import { AppBackMessage } from "@matreshka/shared/messages/bff-to-client/app/app-back-message";
import { map, Observable, ReplaySubject, Subscription, switchMap } from "rxjs";
import { Client } from "../../core";
import {
  baselineVisitedAt$,
  waitForRouteChangeAndPageReceipt,
} from "./client-route-page-wait";

/**
 * Back без targeted ack с клиента (как {@link clientNavigatePlatformAction}).
 *
 * Завершение: новый `route.visitedAt`, {@link AppPageMessage} и receipt.
 * Timeout нет; при {@link Client.destroy$} до завершения — error.
 */
export function clientBackPlatformAction(client: Client): Observable<void> {
  const result$ = new ReplaySubject<void>(1);
  let finalized = false;
  const subscriptions = new Subscription();

  const teardown = () => {
    if (finalized) {
      return;
    }
    finalized = true;
    subscriptions.unsubscribe();
  };

  const finishSuccess = () => {
    result$.next(undefined);
    result$.complete();
    teardown();
  };

  const finishError = (error: Error) => {
    result$.error(error);
    teardown();
  };

  subscriptions.add(
    client.destroy$.subscribe(() => {
      if (!finalized) {
        finishError(new Error("Client destroyed before back completed"));
      }
    }),
  );

  subscriptions.add(
    baselineVisitedAt$(client)
      .pipe(
        switchMap((baselineVisitedAt) => {
          client.outcomingMessage$.next(new AppBackMessage());
          return waitForRouteChangeAndPageReceipt(
            client,
            baselineVisitedAt,
          ).pipe(map(() => undefined));
        }),
      )
      .subscribe({
        next: () => finishSuccess(),
        error: (error) =>
          finishError(
            error instanceof Error ? error : new Error(String(error)),
          ),
      }),
  );

  return result$.asObservable();
}
