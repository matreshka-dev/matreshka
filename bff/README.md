# @matreshka/bff

Server-driven UI runtime для Matreshka: маршрутизация, страницы, контекст, DSL компонентов и platform API.

## Установка

```bash
npm install @matreshka/bff @matreshka/shared
```

`@matreshka/shared` подтягивается как зависимость `@matreshka/bff`, но для типов и прямых импортов протокола его часто ставят явно.

## Пример

```typescript
import { stack, text } from "@matreshka/bff/components";
import { Context } from "@matreshka/bff/core";
import { when } from "@matreshka/bff/core/conditions";
```

Точка входа и subpath-экспорты описаны в поле `exports` пакета (`@matreshka/bff/components`, `@matreshka/bff/core`, `@matreshka/bff/platforms` и др.).

## Документация

- [Документация Matreshka](https://github.com/matreshka-dev/matreshka/tree/main/docs/README.md)
- [Getting started](https://github.com/matreshka-dev/matreshka/tree/main/docs/getting-started/overview.md)
- [Первое приложение](https://github.com/matreshka-dev/matreshka/tree/main/docs/getting-started/first-app.md)

## Лицензия

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.ru) (указание авторства, некоммерческое использование). Некоммерческое использование, распространение и адаптация — при соблюдении условий лицензии.

**Коммерческое использование** (в т.ч. в продуктах и сервисах с выручкой) — только по отдельному соглашению: [dmitriy.tretyakov.work@gmail.com](mailto:dmitriy.tretyakov.work@gmail.com).

Полный текст: [LICENSE](./LICENSE).
