# @matreshka/client-bff-protocol

Wire-контракт между клиентом Matreshka и BFF: классы сообщений, парсинг, надёжная доставка, enum-ы и сериализуемые типы UI на проводе.

Сторонний клиент или BFF может подключить только этот пакет — без `@matreshka/bff` и без утилит `@matreshka/shared`.

## Установка

```bash
npm install @matreshka/client-bff-protocol
```

## Пример

```typescript
import { registerBffToClientMessages } from "@matreshka/client-bff-protocol/messages/bff-to-client/register-messages";
import { parseBffToClientMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/parse-bff-to-client-message";
import type { PageConfig } from "@matreshka/client-bff-protocol/types/page-config";
import { ServerComponentClass } from "@matreshka/client-bff-protocol/enums/server-component-class";
```

Subpath-импорты (`@matreshka/client-bff-protocol/messages/...`, `@matreshka/client-bff-protocol/types/...`, `@matreshka/client-bff-protocol/enums/...`) соответствуют структуре каталогов в `dist/`.

Semver npm-пакета в рантайме (Node/BFF, поиск `package.json` вверх от `dist/version.js`, как в `@matreshka/bff`):

```typescript
import { version } from "@matreshka/client-bff-protocol/version";
```

В handshake поле `protocolVersion` подставляют конструкторы `HandshakeMessage` из `package.json` пакета (в бандле Angular — через инлайн JSON).

## Semver

Breaking для этого пакета: новые или изменённые типы сообщений client ↔ BFF, типы/enums на проводе, контракт надёжной доставки. Переименование npm-пакета с `@matreshka/protocol` не считается breaking само по себе.

Базовые `Message` / `MessageRegistry` продублированы в `@matreshka/gateway-bff-protocol`. При изменении JSON-обёртки (`type`, `payload`) поднимайте major **в обоих** protocol-пакетах в одном релизе.

## Документация

- [Документация Matreshka](https://github.com/matreshka-dev/matreshka/tree/main/docs/README.md)
- [Протокол и сообщения](https://github.com/matreshka-dev/matreshka/tree/main/docs/architecture/client-bff-protocol.md)
- [Надёжная доставка](https://github.com/matreshka-dev/matreshka/tree/main/docs/architecture/message-delivery.md)

## Лицензия

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.ru) (указание авторства, некоммерческое использование). Некоммерческое использование, распространение и адаптация — при соблюдении условий лицензии.

**Коммерческое использование** (в т.ч. в продуктах и сервисах с выручкой) — только по отдельному соглашению: [dmitriy.tretyakov.work@gmail.com](mailto:dmitriy.tretyakov.work@gmail.com).

Полный текст: [LICENSE](./LICENSE).
