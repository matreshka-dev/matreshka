# Архитектура matreshka

Этот раздел описывает внутреннее устройство matreshka: какие сущности участвуют в обмене сообщениями, как устроен runtime, где находятся ограничения in-memory модели и какие компромиссы заложены в транспортный слой.

## Что читать в первую очередь

1. [`protocol.md`](protocol.md) — общий wire-format сообщений и основные message groups.
2. [`context-lifecycle.md`](context-lifecycle.md) — жизненный цикл Context на BFF и клиенте, `context-destroy`, holds.
3. [`client-rendering.md`](client-rendering.md) — как клиент загружает контексты, проверяет conditions и монтирует компоненты.
4. [`message-delivery.md`](message-delivery.md) — надёжная доставка, подтверждения получения, retry, дедупликация и RTT/ping.
5. [`operations.md`](operations.md) — reconnect, lifecycle клиента, эксплуатационные ограничения и best practices.

## Карта архитектурных документов

- [`protocol.md`](protocol.md) — базовая форма сообщения, `target`, основные типы обмена между BFF и клиентом.
- [`context-lifecycle.md`](context-lifecycle.md) — создание, sync, destroy на BFF; holds и `pendingDestroy` на клиенте.
- [`client-rendering.md`](client-rendering.md) — `ContextHub`, `ComponentHub`, `ready$`, `display$`, conditions, rules и реакция на `change$`.
- [`message-delivery.md`](message-delivery.md) — детальная схема механизма надёжной отправки и обработки сообщений.
- [`operations.md`](operations.md) — как ведёт себя runtime при disconnect, reconnect, рестарте процесса и multi-instance deployment.
- [`notes.md`](notes.md) — **черновик**, не часть onboarding.

## Что не входит в этот раздел

Практика написания страниц, компонентов и контекстов — в [getting started](../getting-started/overview.md) и [guides](../guides/README.md).
