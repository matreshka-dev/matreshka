# @matreshka/shared

Общие типы, enum-ы и контракты сообщений между BFF Matreshka и клиентом.

## Установка

```bash
npm install @matreshka/shared
```

## Пример

```typescript
import type { ClientState } from "@matreshka/shared/types/client-state";
import { HandshakeMessage } from "@matreshka/shared/messages/bff-to-client/app/handshake-message";
```

Subpath-импорты (`@matreshka/shared/enums/...`, `@matreshka/shared/messages/...`, `@matreshka/shared/types/...`) соответствуют структуре каталогов в `dist/`.

## Документация

- [Документация Matreshka](https://github.com/matreshka-dev/matreshka/tree/main/docs/README.md)
- [Протокол и сообщения](https://github.com/matreshka-dev/matreshka/tree/main/docs/architecture/protocol.md)

## Лицензия

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.ru) (указание авторства, некоммерческое использование). Некоммерческое использование, распространение и адаптация — при соблюдении условий лицензии.

**Коммерческое использование** (в т.ч. в продуктах и сервисах с выручкой) — только по отдельному соглашению: [dmitriy.tretyakov.work@gmail.com](mailto:dmitriy.tretyakov.work@gmail.com).

Полный текст: [LICENSE](./LICENSE).
