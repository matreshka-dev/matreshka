import { AppReloadMessage } from "@matreshka/shared/messages/bff-to-client/app/app-reload-message";
import { Observable, ReplaySubject, take } from "rxjs";
import { Client } from "../../core";

/**
 * Reload platform-action: клиент не может прислать ack до перезагрузки страницы.
 * Успех — первый {@link Client.reconnect$} после отправки {@link AppReloadMessage}
 * (клиент переподключился с тем же token в grace period).
 */
export function clientReloadPlatformAction(client: Client): Observable<void> {
  const result$ = new ReplaySubject<void>(1);
  let finalized = false;

  const teardown = () => {
    if (finalized) {
      return;
    }
    finalized = true;
    reconnectSubscription.unsubscribe();
    destroySubscription.unsubscribe();
  };

  const finish = (notify: () => void) => {
    notify();
    teardown();
  };

  const reconnectSubscription = client.reconnect$
    .pipe(take(1))
    .subscribe(() => {
      finish(() => {
        result$.next(undefined);
        result$.complete();
      });
    });

  const destroySubscription = client.destroy$.subscribe(() => {
    finish(() => {
      result$.error(new Error("Client destroyed before reload reconnect"));
    });
  });

  client.outcomingMessage$.next(new AppReloadMessage());

  return result$.asObservable();
}
