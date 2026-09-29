# Рендеринг, контексты и условия на клиенте

Как Angular-клиент matreshka превращает `ServerComponentConfig` в UI: загрузка контекстов, проверка conditions, монтирование компонентов и реакция на изменения данных.

См. также [`../guides/conditions.md`](../guides/conditions.md) — синтаксис conditions в конфигах.

## Три слоя

| Слой | Где в коде | Задача |
| --- | --- | --- |
| Данные | `ContextHubService` | хранит значения контекстов, запрашивает недостающие, шлёт `change$` |
| Конфигурация | `ComponentHubService` | регистрирует конфиги, считает зависимости, управляет `ready$` |
| Видимость | `ServerComponentsListComponent` | считает `display$`, решает, монтировать wrapper или нет |

Клиент получает **дерево конфигов** и по мере работы — **значения контекстов**. Его job:

1. понять, какие `contextId` нужны каждому конфигу;
2. дождаться их в hub;
3. проверить conditions видимости;
4. смонтировать компонент;
5. обновлять UI при последующих изменениях.

## Общая схема

```text
registerConfig(config)
  → calculateConfigContextDependencies()
  → loadRequiredContextsForEntry()  ──►  ContextHub.init$(contextId)
        │
        ▼
ready$ = true
        │
        ▼
display$ = conditionsMet(conditions)
        │
        ▼
@if (ready$ && display$)  →  ServerComponentWrapper
```

Компонент монтируется только когда **оба** ответа «да»:

- **ready$** — «все контексты из зависимостей конфига уже в hub?»
- **display$** — «conditions видимости выполнены?»

## ContextHubService

In-memory хранилище контекстов на клиенте.

| API | Назначение |
| --- | --- |
| `init$(contextId)` | если контекста нет — запросить его; вернуть поток «контекст готов» |
| `loaded(contextId)` | есть ли контекст в hub |
| `value(ref)` | прочитать значение по пути `contextId.key.nested` |
| `replacePlaceholders(str)` | подставить `@{contextId.path}` в строку |
| `change$` | событие при каждом обновлении контекста |

**init$** вызывается из `ready$`. Компонент не должен читать ref, пока соответствующий контекст не loaded.

**change$** — шина реактивности. На неё подписаны `ComponentHubService` (rerender, rules) и `ServerComponentsListComponent` (пересчёт `display$`).

Если `value()` или `replacePlaceholders()` обращаются к ещё не loaded контексту — бросается `ContextNotLoadedError`. Вызывающий код (conditions, dependency matching) должен трактовать это как «данные пока недоступны», а не как фatal error.

## ComponentHubService

### registerConfig

При появлении конфига hub:

1. сохраняет `ServerComponentConfig` в entry;
2. рекурсивно регистрирует вложенные конфиги;
3. вызывает `updateResolvedConfig` — применяет rules, считает зависимости;
4. запускает цикл **ready$**.

### Зависимости от контекстов

`calculateConfigContextDependencies` собирает все `contextId`, без которых конфиг не может работать:

| Источник в конфиге | Зачем на клиенте |
| --- | --- |
| `properties` с ref | input/output читают и пишут значение |
| плейсхолдеры `@{ctx.field}` в properties | текст, заголовки, динамические ключи |
| `conditions` | проверка видимости в `display$` |
| `rules[].conditions` | выбор overrides до рендера |
| `@{…}` внутри condition ref | кросс-контекстный путь (см. ниже) |

Строка ref может содержать плейсхолдер — фрагмент `@{otherContext.path}`, который резолвится в runtime:

```text
userCtx.cart.items.@{shopCtx.offers.0.id}

зависимости:
  userCtx → cart.items.@{shopCtx.offers.0.id}
  shopCtx → offers.0.id
```

Разбор таких ref — `collectContextRefDependencies()`. Hub добавляет **каждый** контекст в deps, чтобы `ready$` дождался всех участников пути.

Для properties с **вложенными** плейсхолдерами hub рекурсивно расширяет deps: значение поля в уже loaded контексте может оказаться строкой с новым `@{…}`.

### ready$

Поток `Observable<true>`, shared между подписчиками одного конфига.

Цикл `loadRequiredContextsForEntry`:

```text
1. updateResolvedConfig() — актуальные rules и deps
2. собрать contextId, которых ещё нет в hub
3. forkJoin(init$ для каждого) — параллельная загрузка
4. если появились новые deps (вложенные плейсхолдеры) — повторить
5. readyGeneration++, emit true
```

**Зачем per-config ready$:** у карточки в `forEach` и у заголовка страницы разные deps. Hub не ждёт «всю страницу» — только то, что нужно конкретному `config.id`.

При **rerender** (новые deps после смены rules) hub шлёт `readyReload$` и запускает новый цикл, не пересоздавая поток — активные подписки в шаблоне не отваливаются.

### conditionsMet

Единая точка проверки conditions на клиенте. Используется в:

- `display$` — видимость компонента;
- `getActiveRulesKey` — какие rule overrides применить;
- interaction conditions — выполнять ли действие.

Логика — `evaluateConditions()` из shared. Для каждого ref hub вызывает `conditionValue()`:

- контекст не loaded → `UNLOADED_CONTEXT_VALUE`;
- ref с плейсхолдером, внутренний контекст не loaded → тоже `UNLOADED`;
- `UNLOADED` → условие **false**, без throw.

Несколько conditions в массиве — логическое **И**.

### rules

`rules` — conditions не для монтирования, а для **overrides** properties (другой текст, цвет, ref).

Hub применяет rules **внутри** цикла `ready$`:

```text
conditionsMet(rule.conditions)  →  mergeOverride(properties)
  → пересчёт deps  →  догрузка новых контекстов
```

Rule может добавить в конфиг новый плейсхолдер — тогда ready$-цикл не завершится, пока новый контекст не loaded.

### change$ на стороне ComponentHub

Подписка в конструкторе `ComponentHubService`. На каждое событие hub для каждого entry решает:

| Ситуация | Действие |
| --- | --- |
| изменилось поле из rule condition | `rerender$` → новый ready$-цикл + обновление config |
| изменилось поле с `rerender: true` в deps | `requestRerender$` → markForCheck у instances |
| конфиг frozen (forEach leave) | игнорировать |

Сопоставление «этот change затрагивает dep?» — `dependencyChanged()` через `contextChangeAffectsRefDependency()`. Та же модель плейсхолдеров, что и для `display$`. Если плейсхолдер не резолвится — fallback по статическому префиксу до `@{` (например `cart.items.`).

## ServerComponentsListComponent

Рендерит список конфигов через `@for`. Для каждого config — два потока.

### display$

```typescript
prepareConditions(config):
  contextHub.change$
    .filter(релевантные ref из conditions)
    .startWith(null)
    .map(() => componentHub.conditionsMet(conditions))
```

Фильтр change$ смотрит на **все** deps ref — включая контексты из `@{…}` (`contextChangeAffectsRef`).

`prepareDisplay` добавляет leave-анимацию: при переходе `true → false` компонент может ненадолго остаться в DOM до конца hide.

### Шаблон

```html
@if ((componentHub.ready$(config) | async) && (display$.get(config) | async)) {
  <app-server-component-wrapper [id]="config.id" />
}
```

Short-circuit в `&&`: **display$ подписывается только после truthy ready$**. Сначала данные, потом проверка видимости.

Компонент без conditions → `display$ = of(true)`.

## Плейсхолдеры в ref: зачем и как

Кросс-контекстный путь на клиенте всегда строка с `@{…}`:

```text
userCtx.cart.items.@{shopCtx.offers.0.id}
```

Три места, где клиент с этим работает:

| Место | Поведение |
| --- | --- |
| `ready$` | оба contextId в deps |
| `display$` | пересчёт при change$ в userCtx **или** shopCtx |
| `dependencyChanged` | rerender без throw, если плейсхолдер ещё не резолвится |

Утилиты: `collectContextRefDependencies`, `contextChangeAffectsRef`, `contextChangeAffectsRefDependency`.

## Пример: карточка с условием «товар в корзине»

Конфиг карточки приходит с condition ref `userCtx.cart.items.@{shopCtx.offers.0.id}`.

```text
registerConfig(card)
  deps: userCtx, shopCtx
  ready$ → init$(userCtx), init$(shopCtx) → true

шаблон: ready$ true → display$ подписался
  conditionsMet([defined(inCartRef)]) → false (корзина пуста)
  wrapper не монтируется

пользователь добавил товар
  change$ { contextId: userCtx, key: cart.items.7, … }
  display$ пересчитался → true
  wrapper монтируется
```

## Шпаргалка

| Вопрос | Ответ |
| --- | --- |
| Когда wrapper монтируется? | `ready$ && display$` |
| Что делает ready$? | Загружает все contextId из deps конфига |
| Что делает display$? | `conditionsMet` для `config.conditions` |
| Контекст не loaded? | condition = false; `conditionValue` не бросает |
| Когда пересчитывается display$? | `change$` по релевантным ref (включая `@{…}`) |
| Зачем rules-conditions? | Overrides + новые deps до emit ready$ |
| Порядок ready$ и display$? | ready$ первым; display$ ждёт loaded deps |

## Файлы

| Механизм | Путь |
| --- | --- |
| ContextHub | `client/src/app/services/context-hub.service.ts` |
| ComponentHub | `client/src/app/services/component-hub.service.ts` |
| display$, шаблон | `client/src/app/components/server/server-components-list/` |
| Плейсхолдеры в ref | `client/src/app/utils/collect-context-ref-dependencies.ts` |
| evaluate conditions | `shared/utils/evaluate-conditions.ts` |
