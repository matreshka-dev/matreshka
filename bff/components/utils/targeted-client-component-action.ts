import { ComponentCommandMessage } from "@matreshka/shared/messages/bff-to-client/component-command-message";
import { Observable, ReplaySubject } from "rxjs";
import { Client } from "../../core";
import { startTargetedClientAction } from "../../core/utils/targeted-client-action";

export const COMPONENT_ACTION_SCOPE_PREFIX = "component-action-";

export function targetedClientComponentAction(
  client: Client,
  outgoingMessage: (actionScope: string) => ComponentCommandMessage,
): Observable<void> {
  const result$ = new ReplaySubject<void>(1);
  startTargetedClientAction(
    client,
    {
      scopePrefix: COMPONENT_ACTION_SCOPE_PREFIX,
      start: (scope) => {
        client.outcomingMessage$.next(outgoingMessage(scope));
      },
    },
    {
      next: () => {
        result$.next(undefined);
        result$.complete();
      },
      error: (error) => result$.error(error),
      complete: () => result$.complete(),
      closed: () => result$.closed,
    },
  );
  return result$.asObservable();
}
