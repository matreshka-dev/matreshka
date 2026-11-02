/**
 * Делит context-path на id контекста и ключ внутри него.
 *
 * Id контекста — UUID (`Context.id` на BFF), без точек. Разделитель — **первая** точка
 * в строке: `550e8400-e29b-41d4-a716-446655440000.cart.total` →
 * `{ contextId: "550e8400-…", key: "cart.total" }`.
 * Строка без точки — только id, ключ пустой.
 */
export function parseContextPath(path: string) {
  const firstDotIndex = path.indexOf(".");

  if (firstDotIndex === -1) {
    return {
      contextId: path,
      key: "",
    };
  }

  return {
    contextId: path.slice(0, firstDotIndex),
    key: path.slice(firstDotIndex + 1),
  };
}
