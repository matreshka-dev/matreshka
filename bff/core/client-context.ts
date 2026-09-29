import { AsyncLocalStorage } from "node:async_hooks";
import type { Client } from "./client";

const clientStorage = new AsyncLocalStorage<Client>();

/**
 * Возвращает текущего клиента из AsyncLocalStorage (если обработка выполняется внутри Client.newMessage()).
 */
export function currentClient(): Client {
  const client = clientStorage.getStore();
  if (!client) {
    throw new Error("currentClient() available only in matreshka context");
  }
  return client;
}

/** @internal */
export function runWithClient<T>(client: Client, fn: () => T): T {
  return clientStorage.run(client, fn);
}
