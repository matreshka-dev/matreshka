# @matreshka/shared

Утилиты рантайма Matreshka, общие для BFF и клиента (контекст, условия, вложенные элементы).

Контракт обмена сообщениями и сериализуемые типы UI — в пакете [`@matreshka/protocol`](../protocol/README.md).

## Установка

```bash
# В прикладном BFF-проекте обычно достаточно `@matreshka/bff` — shared подтягивается транзитивно.
npm install @matreshka/shared
```

## Пример

```typescript
import { fetchFromObject } from "@matreshka/shared/utils/fetch-from-object";
import type { ClientState } from "@matreshka/protocol/types/client-state";
import { HandshakeMessage } from "@matreshka/protocol/messages/bff-to-client/app/handshake-message";
```

Subpath-импорты утилит: `@matreshka/shared/utils/...`. Типы и сообщения протокола — только через `@matreshka/protocol/...`.

## Документация

- [Документация Matreshka](https://github.com/matreshka-dev/matreshka/tree/main/docs/README.md)
- [Протокол и сообщения](https://github.com/matreshka-dev/matreshka/tree/main/docs/architecture/protocol.md)

## Лицензия

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.ru) (указание авторства, некоммерческое использование). Некоммерческое использование, распространение и адаптация — при соблюдении условий лицензии.

**Коммерческое использование** (в т.ч. в продуктах и сервисах с выручкой) — только по отдельному соглашению: [dmitriy.tretyakov.work@gmail.com](mailto:dmitriy.tretyakov.work@gmail.com).

Полный текст: [LICENSE](./LICENSE).
