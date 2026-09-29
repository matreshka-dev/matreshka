import { fetchFromObject } from "@matreshka/shared/utils/fetch-from-object";
import { Paths } from "ts-essentials";
import { Context } from "../context/context";
import { parseContextPath } from "./parse-context-path";

/**
 * Заменяет плейсхолдеры вида `{ключ}` в строке значениями из объекта контекста.
 *
 * Поддерживает значения по умолчанию через `=` внутри плейсхолдера, например: `{name=Гость}`.
 * Рекурсивно обрабатывает случаи, когда после замены появляются новые плейсхолдеры.
 *
 * @param str Строка с плейсхолдерами.
 * @param resolveContext Поиск контекста по id.
 * @returns Строка с заменёнными плейсхолдерами.
 */
export function replaceContextKeys(
  str: string,
  resolveContext: (contextId: string) => Context<any> | undefined,
) {
  const contextKeys = findContextKeys(str);
  contextKeys.forEach((rule) => {
    const parts = rule.split("="); // Может быть значение по умолчанию, например {name=Иван}
    const path = parts[0];
    const defaultValue = parts[1] ?? "";
    const pathInfo = parseContextPath(path);
    const context = resolveContext(pathInfo.contextId);
    if (!context) {
      throw new Error(`Context ${pathInfo.contextId} not found`);
    }
    if (!context.inited()) {
      throw new Error(`Context ${pathInfo.contextId} not initialized`);
    }
    const value = fetchFromObject(
      context.data$!.getValue(),
      pathInfo.key as Paths<any>,
    );
    str = replaceAll(str, `@{${path}}`, value ?? defaultValue);
  });
  const restContextKeys = findContextKeys(str);
  if (restContextKeys.length) {
    // После замены появились новые замены
    return replaceContextKeys(str, resolveContext);
  }
  return str;
}

/**
 * Находит все плейсхолдеры вида `@{ключ}` в строке, исключая уже обработанные.
 *
 * Плейсхолдеры с подстрокой `%%%` игнорируются, чтобы избежать повторной обработки.
 *
 * @param str Строка для анализа.
 * @returns Массив уникальных ключей, найденных в строке.
 */
function findContextKeys(str: string) {
  const result = new Set<string>();
  let start_pos, end_pos;
  do {
    end_pos = str.indexOf("}");
    if (end_pos !== -1) {
      start_pos = str.substring(0, end_pos).lastIndexOf("{");
      if (start_pos !== -1) {
        const contextKey = str.substring(start_pos + 1, end_pos);
        if (contextKey.indexOf("%%%") === -1) {
          result.add(contextKey);
          str = replaceAll(str, `{${contextKey}}`, `%%%`);
        } else {
          start_pos = -1;
        }
      }
    }
  } while (start_pos !== -1 && end_pos !== -1);
  return [...result];
}

/**
 * Заменяет все вхождения подстроки в строке на заданное значение.
 *
 * Использует регулярное выражение с экранированием.
 *
 * @param str Исходная строка.
 * @param find Подстрока для поиска.
 * @param replace Подстрока для замены.
 * @returns Строка с произведённой заменой.
 */
function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

/**
 * Экранирует специальные символы в строке для безопасного использования в RegExp.
 *
 * @param string Строка, подготавливаемая к использованию в регулярном выражении.
 * @returns Экранированная строка.
 */
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
