/** Результат разбора BFF-токена формата `{numericId}:{secret}`. */
export type ParsedBffToken = {
  id: string;
  secret: string;
};

/**
 * Разбирает BFF-токен в формате Telegram-bot: числовой id, двоеточие, секрет.
 *
 * @param token Полная строка токена, например `"1:dev-secret"`.
 * @returns Разобранные части или `undefined`, если формат невалиден.
 */
export function parseBffToken(token: string): ParsedBffToken | undefined {
  const colonIndex = token.indexOf(":");
  if (colonIndex <= 0 || colonIndex === token.length - 1) {
    return undefined;
  }

  const id = token.slice(0, colonIndex);
  const secret = token.slice(colonIndex + 1);

  if (!/^\d+$/.test(id) || secret.length === 0) {
    return undefined;
  }

  return { id, secret };
}

/**
 * Собирает BFF-токен из числового id и секрета.
 *
 * @param id Числовая часть токена.
 * @param secret Секретная часть токена.
 */
export function formatBffToken(id: string, secret: string): string {
  return `${id}:${secret}`;
}
