import { Subscription } from 'rxjs';
import { contextChangeAffectsRefDependency } from '../../utils/collect-context-ref-dependencies';
import type { ContextHubService } from '../context-hub.service';
import {
  ConfigEntry,
  ContextChangePayload,
  PathContextDependency,
  RULES_DEPENDENCIES_KEY,
} from './component-config-entry.types';
import type { ComponentConfigRules } from './component-config-rules';
import type { ComponentReadyLoader } from './component-ready.loader';

/** Минимальный интерфейс store для обхода конфигов при change$. */
export type ComponentConfigStoreReader = {
  forEachEntry(callback: (entry: ConfigEntry) => void): void;
};

/**
 * Слушает изменения контекста и решает: обновить config от rules
 * или только дернуть rerender у компонентов.
 */
export class ComponentContextReaction {
  private subscription?: Subscription;

  constructor(
    private readonly store: ComponentConfigStoreReader,
    private readonly rules: ComponentConfigRules,
    private readonly readyLoader: ComponentReadyLoader,
    private readonly contextHub: ContextHubService,
    private readonly isEntryDestroyed: (entryId: string) => boolean,
    private readonly isConfigFrozen: (configId: string) => boolean,
    private readonly ready: (
      config: ConfigEntry['config'],
    ) => import('rxjs').Observable<true>,
  ) {}

  /** Подписывается на contextHub.change$ (переподписка при повторном вызове). */
  start(contextChange$: ContextHubService['change$']): void {
    this.subscription?.unsubscribe();
    this.subscription = contextChange$.subscribe((payload) => {
      this.store.forEachEntry((entry) => {
        if (this.isEntryDestroyed(entry.entryId)) {
          return;
        }
        if (this.isConfigFrozen(entry.config.id)) {
          return;
        }
        if (this.shouldUpdateConfigFromRules(entry, payload)) {
          this.readyLoader.rerender$(entry, this.ready).subscribe(() => {
            entry.configSubject.next(structuredClone(entry.config));
          });
          return;
        }

        if (this.shouldRerenderEntry(entry, payload)) {
          this.readyLoader.rerender$(entry, this.ready).subscribe(() => {
            entry.requestRerender$.next();
          });
        }
      });
    });
  }

  /** Затронуто ли это изменение контекста данной зависимостью. */
  private dependencyChanged(
    dep: PathContextDependency,
    payload: ContextChangePayload,
  ) {
    if (!('key' in dep)) {
      return payload.contextId === dep.contextId;
    }

    return contextChangeAffectsRefDependency(
      payload,
      { contextId: dep.contextId, key: dep.key },
      (key) => this.contextHub.replacePlaceholders(key),
    );
  }

  /** Нужен ли rerender UI (зависимость с rerender: true изменилась). */
  private shouldRerenderEntry(
    entry: ConfigEntry,
    payload: ContextChangePayload,
  ) {
    for (const [_path, deps] of entry.contextDependencies.entries()) {
      for (const dep of deps) {
        if (!this.dependencyChanged(dep, payload)) {
          continue;
        }

        if (dep.rerender) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Сменился набор активных rules: сначала догрузить контексты, потом обновить config$.
   */
  private shouldUpdateConfigFromRules(
    entry: ConfigEntry,
    payload: ContextChangePayload,
  ) {
    const deps = entry.contextDependencies.get(RULES_DEPENDENCIES_KEY) || [];
    return (
      deps.some((dep) => this.dependencyChanged(dep, payload)) &&
      this.rules.getActiveRulesKey(entry.sourceConfig) !== entry.activeRulesKey
    );
  }
}
