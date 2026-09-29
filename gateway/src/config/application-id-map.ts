/**
 * Словарь разрешённых applicationId для каждого BFF-сервера.
 * Позже будет синхронизироваться с внешнего сервера.
 */
export const APPLICATION_ID_MAP: Record<string, readonly string[]> = {
  "1": ["localhost:4200"],
  "2": ["localhost:4300"],
};
