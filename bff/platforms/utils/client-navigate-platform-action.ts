import { AppNavigateMessage } from "@matreshka/shared/messages/bff-to-client/app/app-navigate-message";
import { map, Observable, ReplaySubject, Subscription, switchMap } from "rxjs";
import { Client } from "../../core";
import {
  baselineVisitedAt$,
  waitForRouteChangeAndPageReceipt,
} from "./client-route-page-wait";
import {
  clientRouteMatchesNavigatePath,
  isExternalNavigatePath,
} from "./match-navigate-path";

/** Результат `Platform.navigate()`: навигация дошла до доставки page; path может не совпасть (redirect). */
export type NavigateResult = {
  /** Фактический route клиента совпал с маской аргумента `path` (см. match-navigate-path). */
  routeMatched: boolean;
};

/**
 * Navigate без targeted ack с клиента (исключение рядом с {@link clientReloadPlatformAction}).
 *
 * SPA: observable завершается, когда выполнены все шаги:
 * 1. клиент сообщил новый `route.visitedAt` (после {@link AppNavigateMessage});
 * 2. BFF отправил {@link AppPageMessage} для этого route (boot по client-state);
 * 3. пришёл `message-received` на id page (retry через reliable delivery на Client).
 *
 * Искусственного timeout нет: ждём доставку или {@link Client.destroy$}.
 * Несовпадение path (guard, redirect) — не error, только `routeMatched: false`.
 */
export function clientNavigatePlatformAction(
  client: Client,
  path: string,
): Observable<NavigateResult> {
  const result$ = new ReplaySubject<NavigateResult>(1);
  let finalized = false;
  const subscriptions = new Subscription();

  const teardown = () => {
    if (finalized) {
      return;
    }
    finalized = true;
    subscriptions.unsubscribe();
  };

  const finishSuccess = (routeMatched: boolean) => {
    result$.next({ routeMatched });
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
        finishError(new Error("Client destroyed before navigate completed"));
      }
    }),
  );

  // Внешний URL: нет SPA route и AppPageMessage — сразу успех без routeMatched.
  if (isExternalNavigatePath(path)) {
    client.outcomingMessage$.next(new AppNavigateMessage({ path }));
    finishSuccess(false);
    return result$.asObservable();
  }

  subscriptions.add(
    baselineVisitedAt$(client)
      .pipe(
        switchMap((baselineVisitedAt) => {
          client.outcomingMessage$.next(new AppNavigateMessage({ path }));

          return waitForRouteChangeAndPageReceipt(
            client,
            baselineVisitedAt,
          ).pipe(
            map((state) => clientRouteMatchesNavigatePath(state.route, path)),
          );
        }),
      )
      .subscribe({
        next: (routeMatched) => finishSuccess(routeMatched),
        error: (error) =>
          finishError(
            error instanceof Error ? error : new Error(String(error)),
          ),
      }),
  );

  return result$.asObservable();
}
