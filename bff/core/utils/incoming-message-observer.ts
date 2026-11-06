import type { Client } from "../client";

/**
 * Observer для подписок на `incomingMessage$`: синхронные ошибки в `next`
 * и ошибки потока перенаправляются в `client.error$`.
 */
export function incomingMessageObserver<T>(
  client: Client,
  next: (value: T) => void | Promise<void>,
) {
  // Обычный try catch при вызове next не ловит ошибки подписок на поток, поэтому используется такая функция.
  return {
    next: (value: T) => {
      try {
        const result = next(value);
        if (result instanceof Promise) {
          void result.catch((error) => {
            client.error$.next(error);
          });
        }
      } catch (error) {
        client.error$.next(error);
      }
    },
    error: (error: unknown) => {
      client.error$.next(error);
    },
  };
}
