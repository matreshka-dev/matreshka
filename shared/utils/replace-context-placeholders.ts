import { findContextKeys } from "./find-context-keys";

/**
 * Заменяет плейсхолдеры `@{path}` и `@{path=default}` значениями из `resolveValue`.
 *
 * Дефолт — всё, что после первого `=`. Подстановка литеральная: `$` в значении
 * не читается как шаблон. Если после замены появились новые `@{…}`, проход повторяется.
 */
export function replaceContextPlaceholders(
  str: string,
  resolveValue: (path: string) => unknown,
): string {
  const contextKeys = findContextKeys(str);
  for (const rule of contextKeys) {
    const separatorIndex = rule.indexOf("=");
    const path = separatorIndex === -1 ? rule : rule.slice(0, separatorIndex);
    const defaultValue =
      separatorIndex === -1 ? "" : rule.slice(separatorIndex + 1);
    const value = resolveValue(path);
    const replacement = value ?? defaultValue;
    str = replaceLiteral(str, `@{${rule}}`, placeholderText(replacement));
  }
  const restContextKeys = findContextKeys(str);
  if (restContextKeys.length) {
    return replaceContextPlaceholders(str, resolveValue);
  }
  return str;
}

function replaceLiteral(
  str: string,
  find: string,
  replacement: string,
): string {
  return str.split(find).join(replacement);
}

function placeholderText(value: unknown): string {
  switch (typeof value) {
    case "string":
      return value;
    case "number":
    case "boolean":
    case "bigint":
      return String(value);
    case "symbol":
      return value.toString();
    case "undefined":
    case "function":
      return "";
    case "object":
      return value === null ? "" : JSON.stringify(value);
  }
}
