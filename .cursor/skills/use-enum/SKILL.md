---
name: use-enum
description: >-
  Закрытый набор значений в Matreshka задаётся TypeScript enum, а не string union.
  Use when adding a protocol field, payload, config, command, or public BFF/client
  API with a fixed list of allowed values (kind, mode, preload, crossOrigin, status).
---

# Enum вместо перечисления значений

Если у поля конечный список допустимых значений, это `enum`. Строковое объединение (`"audio" | "video"`) для такого поля не использовать.

## Куда класть

Пакет выбирается по тому, кто это значение видит.

- Значение входит в wire-контракт (payload сообщения, общее поле BFF и клиента) — `protocols/client-bff-protocol/enums/<name>.ts`. Строка enum совпадает с тем, что уходит на провод или во внешний API (атрибут DOM, строка протокола). Публичный BFF re-export тем же приёмом, что `TextareaResize`: `export { Name } from "@matreshka/client-bff-protocol/enums/<name>"`.
- Значение нужно только BFF — enum в пакете `bff/`, в протокол не класть.
- Значение нужно только клиенту — enum в пакете `client/`, в протокол не класть.

```ts
export enum MediaPreload {
  None = "none",
  Metadata = "metadata",
  Auto = "auto",
}
```

Имя члена — PascalCase. Строка справа — фактическое значение, не имя члена.

## Когда enum не нужен

Свободная строка, число, флаг и идентификатор (`src`, текст ошибки, `mediaId`) остаются обычными типами. Enum только для закрытого набора, который автор API перечисляет целиком.
