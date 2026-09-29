# Matreshka Workspace

Монорепозиторий с BFF-частью Matreshka, общими контрактами протокола, gateway и универсальным клиентом.

## Что здесь находится

- `bff` — server-driven UI runtime: роутинг, страницы, контексты, DSL компонентов, platform API.
- `shared` — общие типы, enum-ы и message-контракты между BFF и клиентом.
- `gateway` — прослойка между клиентами и несколькими BFF (опционально).
- `client` — универсальный runtime-клиент (Angular).

## Документация

Точка входа — [`docs/README.md`](docs/README.md).

**Быстрый маршрут для BFF-разработчика:**

1. [`docs/getting-started/overview.md`](docs/getting-started/overview.md)
2. [`docs/getting-started/local-setup.md`](docs/getting-started/local-setup.md)
3. [`docs/getting-started/first-app.md`](docs/getting-started/first-app.md)
4. [`docs/getting-started/state-and-events.md`](docs/getting-started/state-and-events.md)
5. [`docs/getting-started/next-steps.md`](docs/getting-started/next-steps.md)

Дополнительно:

- [`docs/guides/README.md`](docs/guides/README.md) — тематические руководства
- [`docs/reference/README.md`](docs/reference/README.md) — справочники API
- [`docs/architecture/README.md`](docs/architecture/README.md) — протокол и эксплуатация
- [`docs/gateway/README.md`](docs/gateway/README.md) — gateway
- [`docs/ai/agent-skills.md`](docs/ai/agent-skills.md) — agent skills для AI-ассистентов

## Команды

```bash
npm run build
```

Собирает `@matreshka/shared`, `@matreshka/gateway` и `@matreshka/bff`.

Клиент — отдельно: `cd client && npm install && ng serve`.

## Angular MCP

Для подключения Angular MCP в Cursor создайте локальный `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "npm",
      "args": ["--silent", "run", "mcp:angular"]
    }
  }
}
```

Cursor будет запускать MCP-сервер автоматически. Выполнять
`npm run mcp:angular` в терминале не нужно: при интерактивном запуске Angular
CLI только выводит пример конфигурации для MCP-хоста.
