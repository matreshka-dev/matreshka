import { ActionCompletedMessage } from "@matreshka/shared/messages/client-to-bff/action-completed-message";
import { AnyClientToBffMessage } from "@matreshka/shared/messages/client-to-bff/client-to-bff-message";
import { ErrorMessage } from "@matreshka/shared/messages/client-to-bff/error-message";
import { isTargetedMessage } from "@matreshka/shared/messages/targeted-message";
import { filter, take } from "rxjs";
import { z } from "zod/v4";
import { Client } from "../client";
import { incomingMessageObserver } from "./incoming-message-observer";

const errorMessagePayloadSchema = z.strictObject({
  message: z.string(),
});

export type TargetedClientActionTerminal<T> = {
  next: (value: T) => void;
  error: (error: Error) => void;
  complete: () => void;
  closed: () => boolean;
};

export type TargetedClientActionConfig<T> = {
  scopePrefix: string;
  start: (scope: string, client: Client) => void;
  parseSuccess?: (unsafeMessage: AnyClientToBffMessage) => T | undefined;
  parseFailure?: (unsafeMessage: AnyClientToBffMessage) => Error | undefined;
};

export function createTargetedActionScope(prefix: string): string {
  return prefix + crypto.randomUUID();
}

export function startTargetedClientAction<T>(
  client: Client,
  config: TargetedClientActionConfig<T>,
  terminal: TargetedClientActionTerminal<T>,
): { scope: string; teardown: () => void } {
  const scope = createTargetedActionScope(config.scopePrefix);
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
        if (unsafeMessage instanceof ActionCompletedMessage) {
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

  config.start(scope, client);

  return { scope, teardown };
}
