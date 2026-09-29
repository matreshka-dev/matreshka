import type { Client } from "../client";

/**
 * Observer для подписок на `incomingMessage$`: синхронные ошибки в `next`
 * и ошибки потока перенаправляются в `client.error$`.
 */
export function incomingMessageObserver<T>(
  client: Client,
  next: (value: T) => void,
) {
  // Обычный try catch при вызове next не ловит ошибки подписок на поток, поэтому используется такая функция.
  return {
    next: (value: T) => {
      try {
        next(value);
      } catch (error) {
        client.error$.next(error);
      }
    },
    error: (error: unknown) => {
      client.error$.next(error);
    },
  };
}
