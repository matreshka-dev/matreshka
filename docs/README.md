# Документация Matreshka

Matreshka — **server-driven UI** на BFF: вы описываете страницы, состояние и поведение на сервере; универсальный клиент рендерит UI и шлёт события обратно.

```text
Клиент  ←→  transport  ←→  BFF (@matreshka/bff)
                ↑
         gateway (опционально)
```

## С чего начать (BFF-разработчик)

Пройдите короткий маршрут — **~1–2 часа до первого экрана в браузере**:

1. [Обзор](getting-started/overview.md) — модель и пакеты
2. [Локальная настройка](getting-started/local-setup.md) — сборка и клиент
3. [Первое приложение](getting-started/first-app.md) — Page, route, WebSocket
4. [Состояние и события](getting-started/state-and-events.md) — Context и форма
5. [Следующие шаги](getting-started/next-steps.md) — карта по задачам

## Разделы документации

| Раздел | Для кого | Ссылка |
| ------ | -------- | ------ |
| Getting started | Первое знакомство | [getting-started/](getting-started/overview.md) |
| Guides | Пошаговые темы после onboarding | [guides/README.md](guides/README.md) |
| Recipes | Одна задача — один рецепт | [recipes/cookbook.md](recipes/cookbook.md) |
| Reference | Полные каталоги API | [reference/README.md](reference/README.md) |
| Advanced | Сложные сценарии | [advanced/component-instance.md](advanced/component-instance.md) |
| Architecture | Протокол, доставка, reconnect | [architecture/README.md](architecture/README.md) |
| Gateway | Несколько BFF / единая точка входа | [gateway/README.md](gateway/README.md) |
| AI | Agent skills для Cursor | [ai/agent-skills.md](ai/agent-skills.md) |

**Reference** и **platforms** не нужно читать подряд — открывайте по мере задачи.

## Пакеты в монорепозитории

- `bff/` — `@matreshka/bff`
- `shared/` — `@matreshka/shared`
- `gateway/` — `@matreshka/gateway`
- `client/` — универсальный Angular-клиент

Корневая сборка: `npm run build` (shared → gateway → bff).

## Agent Skills

```bash
npx skills add matreshka-dev/agents--skill
```

Подробнее — [ai/agent-skills.md](ai/agent-skills.md).
