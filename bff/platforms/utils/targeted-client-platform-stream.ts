import { AnyBffToClientMessage } from "@matreshka/shared/messages/bff-to-client/bff-to-client-message";
import { AnyClientToBffMessage } from "@matreshka/shared/messages/client-to-bff/client-to-bff-message";
import { ErrorMessage } from "@matreshka/shared/messages/client-to-bff/error-message";
import { PlatformActionCompletedMessage } from "@matreshka/shared/messages/client-to-bff/platforms/platform-action-completed-message";
import { isTargetedMessage } from "@matreshka/shared/messages/targeted-message";
import { filter, Observable, Subject } from "rxjs";
import { z } from "zod/v4";
import { Client } from "../../core";
import { incomingMessageObserver } from "../../core/utils/incoming-message-observer";

const errorMessagePayloadSchema = z.strictObject({
  message: z.string(),
});

export type TargetedClientPlatformStreamConfig<T> = {
  outgoingMessage: (scope: string) => AnyBffToClientMessage;
  parseItem: (unsafeMessage: AnyClientToBffMessage) => T | undefined;
  parseFailure?: (unsafeMessage: AnyClientToBffMessage) => Error | undefined;
  /** Вызывается при teardown (отписка всех observers, ошибка, complete, destroy клиента). */
  onTeardown?: (scope: string, client: Client) => void;
};

/**
 * Hot platform-action stream: исходящее сообщение при вызове, много входящих с тем же target.
 * Teardown (и {@link TargetedClientPlatformStreamConfig.onTeardown}) — когда не осталось подписчиков,
 * при terminal-сообщении или destroy$ клиента.
 */
export function targetedClientPlatformStream<T>(
  client: Client,
  config: TargetedClientPlatformStreamConfig<T>,
): Observable<T> {
  const scope = "platform-action-" + crypto.randomUUID();
  const bus$ = new Subject<T>();
  let finalized = false;
  let subscriberCount = 0;

  const teardownSession = () => {
    if (finalized) {
      return;
    }
    finalized = true;
    incomingSubscription.unsubscribe();
    destroySubscription.unsubscribe();
    config.onTeardown?.(scope, client);
  };

  const finishWithError = (error: Error) => {
    if (finalized) {
      return;
    }
    bus$.error(error);
    teardownSession();
  };

  const finishComplete = () => {
    if (finalized) {
      return;
    }
    bus$.complete();
    teardownSession();
  };

  const incomingSubscription = client.incomingMessage$
    .pipe(
      filter(
        (unsafeMessage) =>
          isTargetedMessage(unsafeMessage) && unsafeMessage.target === scope,
      ),
    )
    .subscribe(
      incomingMessageObserver(client, (unsafeMessage) => {
        if (finalized) {
          return;
        }
        if (unsafeMessage instanceof ErrorMessage) {
          const messagePayload = errorMessagePayloadSchema.parse(
            unsafeMessage.payload,
          );
          finishWithError(new Error(messagePayload.message));
          return;
        }
        const failure = config.parseFailure?.(unsafeMessage);
        if (failure) {
          finishWithError(failure);
          return;
        }
        if (unsafeMessage instanceof PlatformActionCompletedMessage) {
          finishComplete();
          return;
        }
        const item = config.parseItem(unsafeMessage);
        if (item !== undefined) {
          bus$.next(item);
        }
      }),
    );

  const destroySubscription = client.destroy$.subscribe(() => {
    finishComplete();
  });

  client.outcomingMessage$.next(config.outgoingMessage(scope));

  return new Observable<T>((subscriber) => {
    if (finalized) {
      subscriber.complete();
      return;
    }
    subscriberCount++;
    const inner = bus$.subscribe(subscriber);
    return () => {
      inner.unsubscribe();
      subscriberCount--;
      if (subscriberCount === 0 && !finalized) {
        teardownSession();
      }
    };
  });
}
