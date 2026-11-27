# Обновление пакетов Matreshka

**Цель:** обновить BFF и клиент так, чтобы они использовали одну версию контракта (`@matreshka/client-bff-protocol` / `protocolVersion` в handshake).

**Предпосылки:** пакеты уже стоят из npm ([Локальная настройка](local-setup.md), [Клиент из npm](client-from-npm.md)). Политика semver — [versioning](../reference/versioning.md).

Версии `@matreshka/bff` и `@matreshka/client-*` **не обязаны** совпадать друг с другом и с номером контракта. При багах UI, правках DSL или runtime без изменения контракта его версия часто **остаётся прежней**: handshake и совместимость client ↔ BFF не ломаются. Менять контракт нужно только когда выходит новая версия `@matreshka/client-bff-protocol` (и вы готовы принять её вместе на BFF и клиенте).

## Без смены контракта

Оставить контракт проекта как есть, подтянуть последние BFF и клиент, собранные под него. Dist-tag `client-bff-protocol-<ver>` при каждой публикации сдвигается на свежие пакеты с той же версией контракта — повторная установка по тегу забирает их. Пакет `@matreshka/client-bff-protocol` переустанавливать не нужно: версия контракта не меняется.

Узнайте текущую версию контракта в проекте (`npm ls @matreshka/client-bff-protocol`), затем (пример `0.8.0`):

```bash
npm install @matreshka/bff@client-bff-protocol-0.8.0
npm install @matreshka/client-browser@client-bff-protocol-0.8.0
```

Не используйте здесь `npm view @matreshka/client-bff-protocol version` — это latest с registry; он нужен в разделе ниже, когда сознательно принимаете новый контракт.

Для другой платформы клиента замените `client-browser` (`client-android`, `client-ios`, `client-telegram`, `client-max`).

Перезапустите BFF. Раздача клиента обновится через `postinstall` / sync — см. [Клиент из npm](client-from-npm.md).

Новый API BFF при той же версии контракта всё ещё может потребовать правок **вашего** кода приложения (semver minor/major самого `@matreshka/bff`). Версия контракта при этом не меняется.

## До последних версий (возможен новый контракт)

Если готовы принять актуальный контракт с npm:

```bash
PROTOCOL=$(npm view @matreshka/client-bff-protocol version)
npm install @matreshka/bff@client-bff-protocol-$PROTOCOL
npm install @matreshka/client-bff-protocol@$PROTOCOL
npm install @matreshka/client-browser@client-bff-protocol-$PROTOCOL
```

Если latest совпадает с тем, что уже в проекте, поведение как в разделе выше. Если нет — обновите BFF и клиент **вместе**, иначе handshake отвергнет settings.

Новая версия контракта может нести **breaking changes**. Тогда одной установки пакетов может быть недостаточно: нужно адаптировать код BFF-приложения под изменения (и при необходимости свериться с [политикой версий](../reference/versioning.md) и changelog/release notes пакетов).

## Dist-tag совместимости

При публикации (`scripts/publish-packages.mjs`) на `@matreshka/bff` и на каждый `@matreshka/client-*` вешается npm dist-tag:

```text
client-bff-protocol-<версия контракта>
```

Например, при контракте `0.8.0` и bff `0.40.0`:

```text
client-bff-protocol-0.8.0 → @matreshka/bff@0.40.0
client-bff-protocol-0.8.0 → @matreshka/client-browser@0.29.0
```

По этому тегу ставят **совместимую пару** BFF + клиент, не подбирая номера пакетов вручную. На `@matreshka/bff` также есть `gateway-bff-protocol-<ver>` для gateway — в этом гайде не разбирается.

## На конкретную версию контракта

Тот же порядок, но версию контракта задаёте сами (пример `0.8.0`) — удобно зафиксировать её или откатиться:

```bash
npm install @matreshka/bff@client-bff-protocol-0.8.0
npm install @matreshka/client-bff-protocol@0.8.0
npm install @matreshka/client-browser@client-bff-protocol-0.8.0
```

Какие теги совместимости есть у BFF:

```bash
npm view @matreshka/bff dist-tags
```

Какой semver пакета спрятан за тегом:

```bash
npm view @matreshka/bff@client-bff-protocol-0.8.0 version
npm view @matreshka/client-browser@client-bff-protocol-0.8.0 version
```

## Как узнать версию контракта у установленного BFF

Из зависимости установленного пакета:

```bash
npm ls @matreshka/client-bff-protocol
```

Или напрямую:

```bash
node -p "require('@matreshka/bff/package.json').dependencies['@matreshka/client-bff-protocol']"
```

По конкретной версии BFF в registry (без локальной установки):

```bash
npm view @matreshka/bff@0.40.0 dependencies.@matreshka/client-bff-protocol
```

По dist-tags: найдите тег `client-bff-protocol-*`, который указывает на вашу версию BFF:

```bash
npm view @matreshka/bff version
npm view @matreshka/bff dist-tags
```

## Ожидаемый результат

У BFF-приложения и у `@matreshka/client-*` одна версия контракта; handshake проходит, settings применяются.

## Что дальше

- Поставка клиента: [Клиент из npm](client-from-npm.md)
- Semver и каскад релизов: [Политика версий](../reference/versioning.md)
