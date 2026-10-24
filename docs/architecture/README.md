# Архитектура matreshka

Этот раздел описывает внутреннее устройство matreshka: какие сущности участвуют в обмене сообщениями, как устроен runtime, где находятся ограничения in-memory модели и какие компромиссы заложены в транспортный слой.

## Что читать в первую очередь

1. [`protocol.md`](protocol.md) — общий wire-format сообщений и основные message groups.
2. [`platform-actions.md`](platform-actions.md) — философия platform-action: обязательный ответ клиента (результат или ack).
3. [`context-lifecycle.md`](context-lifecycle.md) — жизненный цикл Context на BFF и клиенте, `context-destroy`, holds.
4. [`context-update-delivery.md`](context-update-delivery.md) — completion у `Context.set` / `replace` / `ref.set` и ожидание receipt всех адресатов diff.
5. [`client-rendering.md`](client-rendering.md) — как клиент загружает контексты, проверяет conditions и монтирует компоненты.
6. [`message-delivery.md`](message-delivery.md) — надёжная доставка, подтверждения получения, retry, дедупликация и RTT/ping.
7. [`operations.md`](operations.md) — reconnect, lifecycle клиента, эксплуатационные ограничения и best practices.

## Карта архитектурных документов

- [`protocol.md`](protocol.md) — базовая форма сообщения, `target`, основные типы обмена между BFF и клиентом.
- [`platform-actions.md`](platform-actions.md) — request/response платформы, результат или пустой ack, отслеживание и цепочки после завершения.
- [`context-lifecycle.md`](context-lifecycle.md) — создание, sync, destroy на BFF; holds и `pendingDestroy` на клиенте.
- [`context-update-delivery.md`](context-update-delivery.md) — server-side completion для `Context` updates и связь с reliable receipt.
- [`client-rendering.md`](client-rendering.md) — `ContextHub`, `ComponentHub`, `ready$`, `display$`, conditions, rules и реакция на `change$`.
- [`overlay-dom-order.md`](overlay-dom-order.md) — порядок overlays в DOM вокруг основного контента для корректной tab order без настроек на BFF.
- [`message-delivery.md`](message-delivery.md) — детальная схема механизма надёжной отправки и обработки сообщений.
- [`operations.md`](operations.md) — как ведёт себя runtime при disconnect, reconnect, рестарте процесса и multi-instance deployment.
- [`notes.md`](notes.md) — **черновик**, не часть onboarding.

## Что не входит в этот раздел

Практика написания страниц, компонентов и контекстов — в [getting started](../getting-started/overview.md) и [guides](../guides/README.md).
