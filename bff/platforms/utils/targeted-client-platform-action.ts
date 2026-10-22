import { AnyBffToClientMessage } from "@matreshka/shared/messages/bff-to-client/bff-to-client-message";
import { AnyClientToBffMessage } from "@matreshka/shared/messages/client-to-bff/client-to-bff-message";
import { ErrorMessage } from "@matreshka/shared/messages/client-to-bff/error-message";
import { PlatformActionCompletedMessage } from "@matreshka/shared/messages/client-to-bff/platforms/platform-action-completed-message";
import { isTargetedMessage } from "@matreshka/shared/messages/targeted-message";
import { filter, Observable, ReplaySubject, take } from "rxjs";
import { z } from "zod/v4";
import { Client } from "../../core";
import { incomingMessageObserver } from "../../core/utils/incoming-message-observer";

const errorMessagePayloadSchema = z.strictObject({
  message: z.string(),
});

export type TargetedClientPlatformActionConfig<T> = {
  outgoingMessage: (scope: string) => AnyBffToClientMessage;
  parseSuccess?: (unsafeMessage: AnyClientToBffMessage) => T | undefined;
  /** Ответ клиента, который завершает action ошибкой (например отмена диалога). */
  parseFailure?: (unsafeMessage: AnyClientToBffMessage) => Error | undefined;
};

type TargetedClientPlatformActionTerminal<T> = {
  next: (value: T) => void;
  error: (error: Error) => void;
  complete: () => void;
  closed: () => boolean;
};

function startTargetedClientPlatformAction<T>(
  client: Client,
  config: TargetedClientPlatformActionConfig<T>,
  terminal: TargetedClientPlatformActionTerminal<T>,
): { start: () => void; teardown: () => void } {
  const scope = "platform-action-" + crypto.randomUUID();
  let finalized = false;

  const teardown = () => {
    if (finalized) {
      return;
    }
    finalized = true;
    subscription.unsubscribe();
    destroySubscription.unsubscribe();
  };

  const finish = (notify: () => void) => {
    notify();
    teardown();
  };

  const subscription = client.incomingMessage$
    .pipe(
      filter(
        (unsafeMessage) =>
          isTargetedMessage(unsafeMessage) && unsafeMessage.target === scope,
      ),
      take(1),
    )
    .subscribe(
      incomingMessageObserver(client, (unsafeMessage) => {
        if (unsafeMessage instanceof ErrorMessage) {
          const messagePayload = errorMessagePayloadSchema.parse(
            unsafeMessage.payload,
          );
          finish(() => terminal.error(new Error(messagePayload.message)));
          return;
        }
        if (unsafeMessage instanceof PlatformActionCompletedMessage) {
          finish(() => {
            terminal.next(undefined as T);
            terminal.complete();
          });
          return;
        }
        const failure = config.parseFailure?.(unsafeMessage);
        if (failure) {
          finish(() => terminal.error(failure));
          return;
        }
        const value = config.parseSuccess?.(unsafeMessage);
        if (value !== undefined) {
          finish(() => {
            terminal.next(value);
            terminal.complete();
          });
        }
      }),
    );

  const destroySubscription = client.destroy$.subscribe(() => {
    if (!terminal.closed()) {
      terminal.complete();
    }
    teardown();
  });

  const start = () => {
    client.outcomingMessage$.next(config.outgoingMessage(scope));
  };

  return { start, teardown };
}

export function targetedClientPlatformAction<T>(
  client: Client,
  config: TargetedClientPlatformActionConfig<T>,
): Observable<T> {
  const result$ = new ReplaySubject<T>(1);
  const { start } = startTargetedClientPlatformAction(client, config, {
    next: (value) => {
      result$.next(value);
      result$.complete();
    },
    error: (error) => result$.error(error),
    complete: () => result$.complete(),
    closed: () => result$.closed,
  });
  start();
  return result$.asObservable();
}
