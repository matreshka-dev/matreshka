# Matreshka — инструкции для агентов

## Структура

- `client/` — Angular-клиент.
- `bff/` — BFF runtime и DSL компонентов.
- `gateway/` — транспортный шлюз.
- `protocols/client-bff-protocol/` — wire-контракт client ↔ BFF (`@matreshka/client-bff-protocol`).
- `protocols/gateway-bff-protocol/` — wire-контракт gateway ↔ BFF (`@matreshka/gateway-bff-protocol`).
- `shared/` — утилиты рантайма для BFF и клиента.
- `docs/` — документация проекта.
- `.cursor/skills/` — скиллы для агентов (platform-action — платформенные команды; component-action — imperative-команды BFF-компонентов на клиент).

## Работа с изменениями

- Не изменяй файлы за пределами текущей задачи.
- Не редактируй сгенерированные файлы вручную.
- Не публикуй пакеты и не создавай релизы без прямого запроса.
- При изменении публичного API обновляй связанную документацию.

## Форматирование

После изменения исходного кода запусти `npm run format` в каждом затронутом
пакете: `client`, `bff`, `gateway`, `protocols/client-bff-protocol`, `protocols/gateway-bff-protocol` или `shared`.

Для правок только in Markdown и конфигурации запускать форматирование не нужно.

## Проверка

- Запускай релевантные тесты после изменения логики.
- Для `client`, `gateway`, обоих protocol-пакетов и `shared` запускай `npm run lint`.
- Для `bff` запускай `npx eslint .`.
- Для общей сборки пакетов используй `npm run build` из корня репозитория.
- Не исправляй посторонние ошибки, не связанные с текущей задачей.
