/**
 * Эвристика для фабрики кнопки: передан самостоятельный компонент, а не объект InitConfig.
 */
export function isStandaloneComponentLike(x: unknown): boolean {
  return (
    typeof x === "object" &&
    x !== null &&
    "standalone" in x &&
    typeof (x as { standalone?: unknown }).standalone === "function"
  );
}
