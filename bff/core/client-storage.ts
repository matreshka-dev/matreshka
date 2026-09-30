import { AppStorageValueMessage } from "@matreshka/shared/messages/bff-to-client/app/index";
import { fetchFromObject } from "@matreshka/shared/utils/fetch-from-object";
import type { Client } from "./client";
import { setObjectProperty } from "./utils/set-object-property";

/**
 * Доступ к клиентскому key-value хранилищу из {@link ClientState.storage}.
 */
export class ClientStorage {
  constructor(private readonly client: Client) {}

  /**
   * Возвращает значение из клиентского хранилища по заданному ключу.
   *
   * @param key Ключ значения (поддерживается dot-path).
   * @returns Значение, если оно существует.
   */
  get(key: string) {
    return fetchFromObject(
      this.client.state$.getValue().storage,
      key,
    ) as unknown as string;
  }

  /**
   * Устанавливает значение в клиентское хранилище и отправляет соответствующее сообщение.
   *
   * @param key Ключ значения.
   * @param value Значение или undefined для удаления.
   */
  set(key: string, value: string | undefined): void {
    const storage = this.client.state$.getValue().storage;
    setObjectProperty(storage, key, value as any);
    this.client.state$.next({ ...this.client.state$.getValue(), storage });
    const message = new AppStorageValueMessage({ key, value });
    this.client.outcomingMessage$.next(message);
  }

  /**
   * Удаляет значение из хранилища по ключу.
   *
   * @param key Ключ для удаления.
   */
  clear(key: string): void {
    this.set(key, undefined);
  }
}
