import { Paths, PathValue } from "ts-essentials";

/**
 * Извлекает значение из вложенного объекта по строковому пути.
 *
 * Если путь существует и все промежуточные ключи валидны, возвращает значение по этому пути.
 * Если один из ключей отсутствует или содержит `null`/`undefined`, возвращает `undefined`.
 * Пустой путь (`""`) возвращает сам объект.
 *
 * Два сценария использования:
 * - типобезопасный: `path` — это `Paths<O>`, тогда возвращается `PathValue<O, K>`;
 * - произвольный путь (просто `string`) — тогда возвращается `unknown`.
 */
export function fetchFromObject<O, K extends string>(
  obj: O,
  path: K,
): K extends Paths<O> ? PathValue<O, K> : unknown;
export function fetchFromObject(
  obj: Record<string, unknown>,
  path: string,
): unknown {
  if (path === "") {
    return obj;
  }

  const keys = path.split(".");

  let currentObj = obj;
  for (const key of keys) {
    const value = currentObj[key];
    if (value === undefined || value === null) {
      return undefined;
    }

    currentObj = value as Record<string, unknown>;
  }

  return currentObj;
}
