# Обзор Matreshka для BFF-разработчика

**Цель:** понять, из чего состоит система и какие части вы пишете на BFF.

**Предпосылки:** базовый TypeScript и Node.js.

## Что такое Matreshka

Matreshka — **server-driven UI**: интерфейс собирается на BFF, клиент только рендерит дерево компонентов и отправляет события обратно.

```text
Клиент (Angular)  ←→  transport (WebSocket / SSE)  ←→  BFF (@matreshka/bff)
```

Вы на BFF описываете:

- **страницы** (`Page`) — заголовок и дерево компонентов;
- **маршруты** (`Router`) — какой `Page` показать по URL;
- **состояние** (`Context`) — данные экрана, синхронизируемые с клиентом;
- **действия** — обработчики кликов, submit, platform API.

Клиент универсальный: его код менять не нужно для типичного приложения.

## Пакеты

Для **своего** BFF-приложения ставьте готовые пакеты с [npm](https://www.npmjs.com/org/matreshka):

```bash
npm install @matreshka/bff @matreshka/client-bff-protocol
# при необходимости нескольких BFF за одной точкой входа:
npm install @matreshka/gateway
```

`@matreshka/client-bff-protocol` ставят явно, если в коде приложения импортируют типы сообщений или wire-типы (частый случай); версию держите в линейке с BFF и клиентом. `@matreshka/shared` — внутренние утилиты рантайма; для BFF-приложения **не нужен** отдельной зависимостью, он приходит транзитивно через `@matreshka/bff`. Подключайте `@matreshka/shared` только если сами импортируете его утилиты. Для **стороннего** клиента или BFF без `@matreshka/bff` достаточно `@matreshka/client-bff-protocol`.

| Пакет | Назначение |
| ----- | ---------- |
| `@matreshka/bff` | Runtime, DSL компонентов, роутинг, контексты |
| `@matreshka/client-bff-protocol` | Сообщения, типы и enum-ы wire-протокола client ↔ BFF |
| `@matreshka/shared` | Утилиты рантайма (транзитивно через BFF; явно — только при прямых импортах) |
| `@matreshka/gateway` | Опционально: несколько BFF за одной точкой входа |

Собирать эти пакеты из исходников **не нужно** — только добавить зависимости в свой Node-проект и писать BFF-код.

Универсальный Angular-клиент — отдельное приложение (в репозитории Matreshka каталог `client/`). Его подключают к вашему BFF по WebSocket/SSE; для типичного сценария клиентский код не форкают.

**Важно:** строка `@matreshka/client-bff-protocol` (поле `protocolVersion` в handshake) у универсального клиента и у BFF должна **совпадать**. Номера `@matreshka/client` и `@matreshka/bff` могут отличаться — см. [политику версий](../reference/versioning.md).

### Если вы работаете с исходниками Matreshka

Клонированный монорепозиторий нужен **контрибьюторам** и тем, кто разрабатывает сам runtime или клиент. Тогда из корня репозитория: `npm install` и `npm run build` (собирает `protocols/client-bff-protocol`, `protocols/gateway-bff-protocol`, `shared`, `gateway`, `bff`). Это не часть обычного onboarding прикладного BFF.

## Ключевые понятия

### Page

Класс, наследник `Page`, с методами `title()` и `content()`. При смене route BFF создаёт страницу, вызывает `boot()` и отправляет клиенту сериализованное дерево.

### Router

`app.router.addPage("/path", async () => new MyPage())` — сопоставление URL и страницы. Поддерживаются параметры и guards (см. [Роутинг](../guides/routing.md)).

### Context

Серверное состояние сценария (форма, список, экран). В разметке используйте `this.context.ref("field")`, чтобы UI обновлялся при изменениях. В обработчиках на BFF — `get`, `set`, `replace`, `update` или `ref.get()` / `ref.set()` / `ref.update()`.

### Transport

BFF не поднимает HTTP для UI сам по себе — вы подключаете WebSocket или SSE и связываете сокет с `Client` из `Matreshka` (`getClient`, `newMessage`, `attachTransport`, `initClient`).

### Client settings

После handshake BFF отдаёт шрифты, цвета и метаданные приложения. Минимальный набор — в [Первое приложение](first-app.md); все поля — в [справочнике](../reference/client-settings.md).

## Ожидаемый результат

После этой главы вы знаете, **что писать на BFF** и **что не трогать в клиенте** на старте.

## Что дальше

**Следующий обязательный шаг:** [Локальная настройка](local-setup.md) —
npm-зависимости BFF и запуск клиента. Дальше каждая глава приведёт к следующей
по основному маршруту.
