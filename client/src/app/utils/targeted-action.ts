import { ActionCompletedMessage } from '@shared/messages/client-to-bff/action-completed-message';
import { ErrorMessage } from '@shared/messages/client-to-bff/error-message';
import { PostmanService } from '../services/postman.service';

export function completeTargetedAction(
  postman: PostmanService,
  target: string,
): void {
  postman.outcomingMessage$.next(new ActionCompletedMessage(target));
}

export function failTargetedAction(
  postman: PostmanService,
  target: string,
  error: unknown,
): void {
  postman.outcomingMessage$.next(
    new ErrorMessage(target, {
      message: error instanceof Error ? error.message : String(error),
    }),
  );
}

export function runTargetedAction(
  postman: PostmanService,
  target: string,
  action: () => void | Promise<void>,
): void {
  void Promise.resolve()
    .then(action)
    .then(
      () => completeTargetedAction(postman, target),
      (error) => failTargetedAction(postman, target, error),
    );
}
