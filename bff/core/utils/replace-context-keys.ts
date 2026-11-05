import { parseContextPath } from "@matreshka/shared/utils/parse-context-path";
import { replaceContextPlaceholders } from "@matreshka/shared/utils/replace-context-placeholders";
import { Paths } from "ts-essentials";
import type { AnyContext } from "../context/context";

/**
 * Заменяет плейсхолдеры вида `@{ключ}` в строке значениями из объекта контекста.
 *
 * Поддерживает значения по умолчанию через `=` внутри плейсхолдера, например: `@{name=Гость}`.
 * Рекурсивно обрабатывает случаи, когда после замены появляются новые плейсхолдеры.
 *
 * @param str Строка с плейсхолдерами.
 * @param resolveContext Поиск контекста по id.
 * @returns Строка с заменёнными плейсхолдерами.
 */
export function replaceContextKeys(
  str: string,
  resolveContext: (contextId: string) => AnyContext | undefined,
) {
  return replaceContextPlaceholders(str, (path) => {
    const pathInfo = parseContextPath(path);
    const context = resolveContext(pathInfo.contextId);
    if (!context) {
      throw new Error(`Context ${pathInfo.contextId} not found`);
    }
    if (!context.inited()) {
      throw new Error(`Context ${pathInfo.contextId} not initialized`);
    }
    return context.get(pathInfo.key as Paths<any>);
  });
}
