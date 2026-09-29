/** Привязка client token (из BFF handshake) к BFF и клиентской сессии gateway. */
export type TokenRegistryEntry = {
  bffId: string;
  sessionId: string;
};

/**
 * In-memory реестр client token → BFF для маршрутизации reconnect без повторного client handshake.
 */
export class TokenRegistry {
  private readonly entries = new Map<string, TokenRegistryEntry>();

  /**
   * Регистрирует client token после BFF handshake.
   *
   * @param clientToken Token сессии клиента из payload BFF `handshake`.
   * @param entry Привязка к BFF и session id gateway.
   */
  register(clientToken: string, entry: TokenRegistryEntry): void {
    this.entries.set(clientToken, entry);
  }

  /**
   * Ищет привязку по client token (например из query `?token=` при reconnect).
   *
   * @param clientToken Token сессии клиента.
   */
  lookup(clientToken: string): TokenRegistryEntry | undefined {
    return this.entries.get(clientToken);
  }

  /**
   * Удаляет все записи, связанные с клиентской сессией gateway.
   *
   * @param sessionId Id сессии в gateway.
   */
  removeBySession(sessionId: string): void {
    for (const [token, entry] of this.entries.entries()) {
      if (entry.sessionId === sessionId) {
        this.entries.delete(token);
      }
    }
  }

  /**
   * Удаляет все записи, связанные с отключившимся BFF.
   *
   * @param bffId Id BFF-сервера.
   */
  removeByBff(bffId: string): void {
    for (const [token, entry] of this.entries.entries()) {
      if (entry.bffId === bffId) {
        this.entries.delete(token);
      }
    }
  }
}
