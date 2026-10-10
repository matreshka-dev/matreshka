# Agent Skills для разработки на Matreshka

Дополнение к [документации](../README.md) и [getting started](../getting-started/overview.md).

[Agent Skills](https://skills.sh/) — модульные инструкции для AI-агентов в Cursor и других средах. Набор для Matreshka BFF помогает агенту следовать соглашениям фреймворка: `Context`, `ContextRef`, layout, routing, overlays, формы и типичные ошибки при сериализации страниц.

Полный каталог с краткими описаниями — в [репозитории agents--skill](https://github.com/matreshka-dev/agents--skill).

## Установка

Из корня репозитория или любого проекта на Matreshka:

```bash
npx skills add matreshka-dev/agents--skill
```

CLI клонирует [репозиторий skills](https://github.com/matreshka-dev/agents--skill) и копирует пакеты в `.agents/skills/` (для Cursor — также в каталог skills агента, в зависимости от настроек CLI).

Обновление уже установленных skills:

```bash
npx skills update
```

Поиск других skills в экосистеме:

```bash
npx skills find matreshka
```

Установка отдельных скиллов:

```bash
npx skills add matreshka-dev/agents--skill --skill context-init-in-boot prefer-context-ref-in-ui
```

## Когда какой скилл подключать

Скиллы не заменяют guides, но срабатывают точечно при правках BFF-кода. Ниже — ориентир по задачам; детали в `SKILL.md` каждого пакета.

### Context и сериализация страницы

| Задача                                         | Скилл                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Новый `Context` — destroy / `persistent`       | `context-plan-destroy-on-create`                                 |
| Process-wide кэш (`persistent: true`)          | `context-plan-destroy-on-create`                                 |
| `context.value()` в `content()` / `overlays()` | `context-init-in-boot`                                           |
| Реактивный UI без лишнего `init()`             | `prefer-context-ref-in-ui`, `context-init-in-boot` (lazy + refs) |
| Плейсхолдеры в строках и `link`                | `context-ref-in-strings`                                         |
| Уничтожение Context с Page/Dialog              | `context-destroy-with-entry`                                     |
| Badge/корзина в shell приложения               | `client-scoped-context-for-shared-ui`                            |
| JWT, tenant до построения страницы             | `storage-vs-context`, `route-guard-return-undefined`             |
| Подписка на `data$`                            | `context-subscribe-take-until-destroy`                           |
| Zod на полях ввода                             | `context-zod-draft-not-live-strict`                              |

### UI, списки, entry

| Задача                                 | Скилл                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------- |
| Page/Dialog lifecycle и анимации       | `entry-lifecycle-on-enter-leave`                                       |
| Loading на кнопке                      | `rules-not-conditions-for-loading-ui`, `prevent-duplicate-form-submit` |
| Списки `forEach`                       | `foreach-stable-track`, `strict-context-ref`, `context-value-ref-in-api` |
| Shared-хелпер / метод с ref по типу значения | `context-value-ref-in-api`                                         |
| Типы ref на странице (контекст + путь) | `strict-context-ref`                                                   |
| OR/AND в conditions                    | `when-oneof-vs-when-any`                                               |
| Один Component в двух местах / animate | `create-instance-before-serialize`                                     |
| Color token «not found»                | `register-color-tokens`                                                |

### События, формы, навигация

| Задача                               | Скилл                          |
| ------------------------------------ | ------------------------------ |
| Форма и Enter                        | `form-submit-shared-handler`   |
| Async ошибки в UI                    | `return-server-action-promise` |
| Auth и инварианты в ServerAction     | `server-action-validate-in-handler` |
| Мгновенный toggle/loading на клиенте | `instant-ui-set-context-value` |
| Ссылка vs программный переход        | `link-vs-navigate`             |
| Диалог vs меню у кнопки              | `dialog-vs-popover-platform`   |

### Layout

| Задача                          | Скилл                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `grow` / `basis` во flex        | `flex-item-in-stack`                                                                                      |
| RTL, safe area, overlay anchors | `layout-start-end-not-left-right`, `safe-area-for-page-dialog-overlays`, `safe-area-with-fixed-flex-item` |
| Таблица колонок                 | `table-layout-with-grid-subgrid`                                                                          |
| FAB на странице                 | `page-overlays-method-vs-set-overlays`                                                                    |

## Связь с документацией

Рекомендуемый порядок guides для человека совпадает с тем, что покрывают скиллы:

1. [Context](../guides/context.md) — скиллы `context-*`, `storage-vs-context`; advanced — [context-destroy-scenarios](../advanced/context-destroy-scenarios.md)
2. [Conditions](../guides/conditions.md) — `when-oneof-vs-when-any`, `rules-not-conditions-for-loading-ui`
3. [События и действия](../guides/events-and-actions.md) — формы, `instant-ui-set-context-value`, `return-server-action-promise`
4. [Layout](../guides/layout.md) и [Overlays](../guides/overlays.md) — layout/safe area/overlays скиллы
5. [Routing](../guides/routing.md) — `route-guard-return-undefined`, `link-vs-navigate`
6. [Cookbook](../recipes/cookbook.md) — практические сценарии

Форматирование после правок TS — [AGENTS.md](../../AGENTS.md) в корне monorepo (`npm run format` в затронутых пакетах).
