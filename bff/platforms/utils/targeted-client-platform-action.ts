import { AnyBffToClientMessage } from "@matreshka/shared/messages/bff-to-client/bff-to-client-message";
import { AnyClientToBffMessage } from "@matreshka/shared/messages/client-to-bff/client-to-bff-message";
import { Observable, ReplaySubject } from "rxjs";
import { Client } from "../../core";
import { startTargetedClientAction } from "../../core/utils/targeted-client-action";

export type TargetedClientPlatformActionConfig<T> = {
  outgoingMessage: (scope: string) => AnyBffToClientMessage;
  parseSuccess?: (unsafeMessage: AnyClientToBffMessage) => T | undefined;
  /** Ответ клиента, который завершает action ошибкой (например отмена диалога). */
  parseFailure?: (unsafeMessage: AnyClientToBffMessage) => Error | undefined;
};

export function targetedClientPlatformAction<T>(
  client: Client,
  config: TargetedClientPlatformActionConfig<T>,
): Observable<T> {
  const result$ = new ReplaySubject<T>(1);
  startTargetedClientAction(
    client,
    {
      scopePrefix: "platform-action-",
      start: (scope) => {
        client.outcomingMessage$.next(config.outgoingMessage(scope));
      },
      parseSuccess: config.parseSuccess,
      parseFailure: config.parseFailure,
    },
    {
      next: (value) => {
        result$.next(value);
        result$.complete();
      },
      error: (error) => result$.error(error),
      complete: () => result$.complete(),
      closed: () => result$.closed,
    },
  );
  return result$.asObservable();
}
