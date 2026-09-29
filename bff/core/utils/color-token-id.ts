import { ColorToken } from "@matreshka/shared/types/color-token";
import { createHash } from "node:crypto";

const cache = new WeakMap<ColorToken, string>();
/**
 * Вычисляет уникальный идентификатор цветового токена на основе его содержимого.
 *
 * Использует алгоритм SHA-1 для создания хеша от сериализованного токена.
 * Позволяет определять идентичность токенов по их содержимому.
 *
 * @param colorToken Объект палитры (для одной темы или обеих).
 * @returns Хеш-идентификатор в шестнадцатеричном виде.
 */
export function colorTokenId(colorToken: ColorToken) {
  const cachedId = cache.get(colorToken);
  if (cachedId) {
    return cachedId;
  }
  const hash = createHash("sha1");
  const id = hash.update(JSON.stringify(colorToken)).digest("hex");
  cache.set(colorToken, id);
  return id;
}
