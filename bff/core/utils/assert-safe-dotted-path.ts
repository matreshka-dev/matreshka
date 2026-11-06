const forbiddenPathSegments = new Set([
  "__proto__",
  "prototype",
  "constructor",
]);

/**
 * Проверяет dotted-путь данных контекста (сегменты между точками).
 * Запрещены пустые сегменты и prototype pollution.
 */
export function assertSafeDottedPath(key: string): void {
  if (!key) {
    throw new Error(`Invalid context path: "${key}"`);
  }
  const parts = key.split(".");
  if (parts.some((part) => !part || forbiddenPathSegments.has(part))) {
    throw new Error(`Invalid context path: "${key}"`);
  }
}
