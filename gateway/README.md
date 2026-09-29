# @matreshka/gateway

Транспортно-независимый relay сообщений между клиентами Matreshka и BFF-серверами.

## Установка

```bash
npm install @matreshka/gateway @matreshka/shared
```

## Пример

```typescript
import { Gateway } from "@matreshka/gateway";
```

Конфигурация, подключение BFF и сессий клиента — в типах `GatewayConfig`, `ConnectBffInput` и связанных API из того же пакета.

## Документация

- [Документация Matreshka](https://github.com/matreshka-dev/matreshka/tree/main/docs/README.md)
- [Gateway](https://github.com/matreshka-dev/matreshka/tree/main/docs/gateway/README.md)

## Лицензия

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.ru) (указание авторства, некоммерческое использование). Некоммерческое использование, распространение и адаптация — при соблюдении условий лицензии.

**Коммерческое использование** (в т.ч. в продуктах и сервисах с выручкой) — только по отдельному соглашению: [dmitriy.tretyakov.work@gmail.com](mailto:dmitriy.tretyakov.work@gmail.com).

Полный текст: [LICENSE](./LICENSE).
