import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { ServerComponent } from '../../components/server/server-component';
import { ServerComponentConfig } from '../../components/server/server-component-config';

/** Служебный ключ: зависимости из условий видимости компонента (`config.conditions`). */
export const CONDITIONS_DEPENDENCIES_KEY = '%%%conditions%%%' as const;
/** Служебный ключ: зависимости из условий правил (`config.rules`). */
export const RULES_DEPENDENCIES_KEY = '%%%rules%%%' as const;
/** Служебный ключ: зависимости из условий действий (`interactions`). */
export const ACTIONS_DEPENDENCIES_KEY = '%%%actions%%%' as const;

/**
 * Одна «точка привязки» конфига к контексту.
 * `rerender: true` — при изменении значения нужно обновить UI (шаблонные плейсхолдеры).
 */
export type PathContextDependency =
  | { contextId: string; rerender: boolean }
  | { contextId: string; key: string; rerender: boolean };

/**
 * Всё состояние одного зарегистрированного конфига в hub:
 * исходник с сервера, актуальный конфиг после rules, подписчики и инстансы Angular.
 */
export type ConfigEntry = {
  /** Конфиг как пришёл с BFF, без overrides от rules. */
  sourceConfig: ServerComponentConfig;
  /** Текущий конфиг после rules; мутируется in-place, изменения рассылаются через configSubject. */
  config: ServerComponentConfig;
  /** Instance id entry-компонента (страница, dialog, popover), которому принадлежит конфиг. */
  entryId: string;
  /** Поток обновлений `config` для компонентов и обёрток. */
  configSubject: BehaviorSubject<ServerComponentConfig>;
  /** Ключ набора активных rules (индексы через запятую), для которого сейчас собран `config`. */
  activeRulesKey: string;
  /** Кеш конфигов после overrides для каждого набора активных rules. */
  resolvedConfigs: Map<string, ServerComponentConfig>;
  /** Сколько раз конфиг зарегистрирован (родитель + forEach); при 0 запись удаляется. */
  useCount: number;
  subscriptions: Subscription[];
  /**
   * Готовность конфигурации к использованию.
   * Поток не завершается и не пересоздаётся, чтобы не ломать уже подписавшихся
   * слушателей во время ререндера.
   * ВАЖНО: эмитится именно `true`, а не `void`, т.к. в шаблонах используется
   * `(componentHub.ready$(config) | async)` в условных блоках (`@if(...)`),
   * где требуется truthy-значение. Переход на `void`/`undefined` «сломает»
   * эти условия, и содержимое просто не отрендерится.
   */
  ready$: Observable<true>;
  /** Счётчик успешных циклов загрузки контекстов; растёт после каждого rerender/load. */
  readyGeneration: number;
  /** Сигнал «начни новый цикл загрузки контекстов» без пересоздания потока ready$. */
  readyReload$: Subject<void>;
  /** Сигнал компонентам: контекст изменился, вызовите markForCheck / обновите view. */
  requestRerender$: Subject<void>;
  /** Живые Angular-инстансы ServerComponent с этим config id. */
  instances: ServerComponent<any>[];
  /** Карта «путь в конфиге или служебный ключ → список зависимостей от контекста». */
  contextDependencies: Map<string, PathContextDependency[]>;
  /** contextId, по которым entry уже вызвал retain в ContextHub (для diff при rules). */
  heldContextIds: Set<string>;
};

/** Событие из ContextHubService: изменились поля одного контекста. */
export type ContextChangePayload = {
  contextId: string;
  values: { key: string; value: unknown }[];
};
