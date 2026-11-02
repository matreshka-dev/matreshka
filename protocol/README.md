# @matreshka/protocol

Wire-контракт между клиентом Matreshka и BFF: классы сообщений, парсинг, надёжная доставка, enum-ы и сериализуемые типы UI на проводе.

Сторонний клиент или BFF может подключить только этот пакет — без `@matreshka/bff` и без утилит `@matreshka/shared`.

## Установка

```bash
npm install @matreshka/protocol
```

## Пример

```typescript
import { registerBffToClientMessages } from "@matreshka/protocol/messages/bff-to-client/register-messages";
import { parseBffToClientMessage } from "@matreshka/protocol/messages/bff-to-client/parse-bff-to-client-message";
import type { PageConfig } from "@matreshka/protocol/types/page-config";
import { ServerComponentClass } from "@matreshka/protocol/enums/server-component-class";
```

Subpath-импорты (`@matreshka/protocol/messages/...`, `@matreshka/protocol/types/...`, `@matreshka/protocol/enums/...`) соответствуют структуре каталогов в `dist/`.

## Документация

- [Документация Matreshka](https://github.com/matreshka-dev/matreshka/tree/main/docs/README.md)
- [Протокол и сообщения](https://github.com/matreshka-dev/matreshka/tree/main/docs/architecture/protocol.md)
- [Надёжная доставка](https://github.com/matreshka-dev/matreshka/tree/main/docs/architecture/message-delivery.md)

## Лицензия

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.ru) (указание авторства, некоммерческое использование). Некоммерческое использование, распространение и адаптация — при соблюдении условий лицензии.

**Коммерческое использование** (в т.ч. в продуктах и сервисах с выручкой) — только по отдельному соглашению: [dmitriy.tretyakov.work@gmail.com](mailto:dmitriy.tretyakov.work@gmail.com).

Полный текст: [LICENSE](./LICENSE).
