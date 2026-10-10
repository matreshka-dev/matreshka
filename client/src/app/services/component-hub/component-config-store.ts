import {
  componentBaseId,
  hasComponentInstanceSuffix,
} from '@shared/utils/component-id';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { ServerComponent } from '../../components/server/server-component';
import {
  ComponentDependencies,
  ServerComponentConfig,
} from '../../components/server/server-component-config';
import type { ConfigEntry } from './component-config-entry.types';

type ServerComponentSettings = Record<
  string,
  { dependencies: ComponentDependencies }
>;

/** Колбэки hub: ready$, rules, lifecycle и freeze при register/delete. */
export type ComponentConfigStoreHooks = {
  createReady$: (entry: ConfigEntry) => ConfigEntry['ready$'];
  updateResolvedConfig: (entry: ConfigEntry, force?: boolean) => boolean;
  onDeleteRootEntry: (entry: ConfigEntry) => void;
  releaseFrozenState: (configId: string) => void;
  /** useCount → 0: release holds до удаления записи из map. */
  onEntryRemoved?: (entry: ConfigEntry) => void;
};

/**
 * Единственное хранилище конфигов по id: регистрация дерева, счётчики useCount,
 * инстансы Angular и потоки config$/ready$.
 */
export class ComponentConfigStore {
  private map = new Map<string, ConfigEntry>();

  constructor(
    private readonly serverComponents: ServerComponentSettings,
    private readonly hooks: ComponentConfigStoreHooks,
  ) {}

  /** Обход всех записей (например, реакция на change$ контекста). */
  forEachEntry(callback: (entry: ConfigEntry) => void): void {
    this.map.forEach(callback);
  }

  /** Внутренняя запись по id конфига или undefined. */
  getEntry(configId: string): ConfigEntry | undefined {
    return this.map.get(configId);
  }

  /**
   * Регистрирует конфиг и рекурсивно вложенные (через registerNested).
   * Повторная регистрация того же id только увеличивает useCount.
   */
  registerConfig(
    config: ServerComponentConfig,
    entryId: string | undefined,
    registerNested: (
      cfg: ServerComponentConfig,
      resolvedEntryId: string,
    ) => void,
  ): void {
    const resolvedEntryId = entryId ?? config.id;
    if (!this.map.has(config.id)) {
      const subscriptions: Subscription[] = [];
      const readyReload$ = new Subject<void>();

      const entry = {
        sourceConfig: structuredClone(config),
        config,
        entryId: resolvedEntryId,
        configSubject: new BehaviorSubject(structuredClone(config)),
        activeRulesKey: '',
        resolvedConfigs: new Map<string, ServerComponentConfig>(),
        instances: [] as ServerComponent<any>[],
        readyGeneration: 0,
        useCount: 1,
        subscriptions,
        requestRerender$: new Subject<void>(),
        contextDependencies: new Map(),
        heldContextIds: new Set<string>(),
        readyReload$,
      } as ConfigEntry;

      entry.ready$ = this.hooks.createReady$(entry);

      this.hooks.updateResolvedConfig(entry, true);
      entry.configSubject.next(structuredClone(entry.config));
      this.map.set(config.id, entry);
    } else {
      this.map.get(config.id)!.useCount++;
    }

    this.getEntrySettings(config)
      .dependencies.getNestedConfigsPaths(config)
      .forEach((cfg) => registerNested(cfg, resolvedEntryId));
  }

  /**
   * Уменьшает useCount; при нуле снимает подписки и удаляет запись.
   * Каскадно обрабатывает вложенные конфиги.
   */
  deleteConfig(config: ServerComponentConfig): void {
    const entry = this.map.get(config.id);
    if (!entry) return;

    entry.useCount -= 1;
    if (entry.useCount === 0) {
      this.hooks.onEntryRemoved?.(entry);
      if (entry.entryId === config.id) {
        this.hooks.onDeleteRootEntry(entry);
      }
      this.completeEntryObservables(entry);
      this.hooks.releaseFrozenState(config.id);
      this.map.delete(config.id);
    }

    this.getEntrySettings(entry.sourceConfig)
      .dependencies.getNestedConfigsPaths(entry.sourceConfig)
      .forEach((cfg) => this.deleteConfig(cfg));
  }

  /**
   * Связывает Angular-компонент с конфигом; возвращает поток requestRerender$.
   */
  addInstance(configId: string, instance: ServerComponent<any>) {
    const entry = this.map.get(configId);
    if (!entry) {
      throw new Error(
        `Component config not found when adding instance: ${configId}`,
      );
    }
    entry.instances.push(instance);
    return entry.requestRerender$;
  }

  /** Убирает инстанс из списка (обычно в ngOnDestroy). */
  deleteInstance(configId: string, instance: ServerComponent<any>) {
    const entry = this.map.get(configId);
    if (entry) {
      entry.instances = entry.instances.filter((item) => item !== instance);
    }
  }

  /** Observable изменений конфига для подписки в шаблоне/компоненте. */
  config$(id: string) {
    return this.map.get(id)?.configSubject.asObservable();
  }

  /** Текущий конфиг; менять только через hub (rules, load). */
  getConfigSnapshot(id: string): Readonly<ServerComponentConfig> | undefined {
    return this.map.get(id)?.config;
  }

  /** Id страницы/dialog/popover, внутри которого лежит этот конфиг. */
  getEntryId(configId: string): string | undefined {
    return this.map.get(configId)?.entryId;
  }

  /** Все живые инстансы с точным config id. */
  getInstances(configId: string): ServerComponent<any>[] {
    return this.map.get(configId)?.instances || [];
  }

  /**
   * Инстансы по id с сервера: точный instance id или базовый id (все копии forEach).
   */
  getInstancesByComponentId(componentId: string): ServerComponent<any>[] {
    const exact = this.map.get(componentId);
    if (exact) {
      return [...exact.instances];
    }
    if (!hasComponentInstanceSuffix(componentId)) {
      const instances: ServerComponent<any>[] = [];
      for (const [configId, entry] of this.map) {
        if (componentBaseId(configId) === componentId) {
          instances.push(...entry.instances);
        }
      }
      return instances;
    }
    return [];
  }

  /** Поток «все нужные контексты загружены» для этого конфига. */
  ready$(config: ServerComponentConfig) {
    const entry = this.map.get(config.id);
    if (!entry) {
      throw new Error(`Component config not found: ${config.id}`);
    }
    return entry.ready$;
  }

  /** Метаданные класса компонента (nested paths, placeholders). */
  getEntrySettings(config: ServerComponentConfig) {
    return this.serverComponents[config.class];
  }

  /** Завершает subjects и отписывает subscriptions при удалении entry. */
  private completeEntryObservables(entry: ConfigEntry) {
    entry.configSubject.complete();
    entry.requestRerender$.complete();
    entry.readyReload$.complete();
    entry.subscriptions.forEach((s: Subscription) => s.unsubscribe());
  }
}
