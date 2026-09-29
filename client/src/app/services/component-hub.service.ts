import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import type { Condition } from '@shared/types/condition';
import { Observable } from 'rxjs';
import { ServerComponent } from '../components/server/server-component';
import { ServerComponentConfig } from '../components/server/server-component-config';
import { SERVER_COMPONENTS } from '../components/server/server-components-injection-token';
import { animateSubtree } from './component-hub/component-animate-subtree';
import { calculateConfigContextDependencies } from './component-hub/component-config-dependencies';
import { ComponentConfigFreeze } from './component-hub/component-config-freeze';
import { ComponentConfigRules } from './component-hub/component-config-rules';
import { ComponentConfigStore } from './component-hub/component-config-store';
import { ComponentContextReaction } from './component-hub/component-context-reaction';
import { ComponentEntryLifecycle } from './component-hub/component-entry-lifecycle';
import { ComponentReadyLoader } from './component-hub/component-ready.loader';
import { ContextHubService } from './context-hub.service';

/**
 * Центральный сервис для server-driven UI на клиенте.
 *
 * Держит конфиги с BFF, связывает их с Angular-компонентами, подгружает контексты,
 * применяет rules, реагирует на изменения данных и управляет жизненным циклом
 * страниц / dialog / popover.
 *
 * В inject для UI используется только этот класс; логика разбита по модулям в `./component-hub/`.
 */
@Injectable({
  providedIn: 'root',
})
export class ComponentHubService {
  private readonly document = inject(DOCUMENT);
  private readonly serverComponents = inject(SERVER_COMPONENTS);
  private readonly contextHub = inject(ContextHubService);

  private readonly rules: ComponentConfigRules;
  private readonly readyLoader: ComponentReadyLoader;
  private readonly entryLifecycle = new ComponentEntryLifecycle();
  private readonly store: ComponentConfigStore;
  private readonly freeze: ComponentConfigFreeze;
  private readonly contextReaction: ComponentContextReaction;

  /** Id конфига, который заморозили (см. freezeConfigSubtree). */
  readonly freezeConfig$: Observable<string>;
  /** Id конфига, который разморозили. */
  readonly unfreezeConfig$: Observable<string>;

  constructor() {
    this.rules = new ComponentConfigRules(
      this.contextHub,
      this.document,
      (config) =>
        calculateConfigContextDependencies(
          config,
          this.contextHub,
          this.serverComponents,
        ),
    );

    this.readyLoader = new ComponentReadyLoader(this.contextHub, this.rules);

    const freezeRef: { current?: ComponentConfigFreeze } = {};

    this.store = new ComponentConfigStore(this.serverComponents, {
      createReady$: (entry) => this.readyLoader.createReady$(entry),
      updateResolvedConfig: (entry, force) =>
        this.rules.updateResolvedConfig(entry, force),
      onDeleteRootEntry: (entry) =>
        this.entryLifecycle.clearRootEntryDestroyState(entry.entryId),
      releaseFrozenState: (configId) =>
        freezeRef.current?.releaseFrozenState(configId),
    });

    this.freeze = new ComponentConfigFreeze(this.serverComponents, (configId) =>
      this.refreshResolvedConfigAfterUnfreeze(configId),
    );
    freezeRef.current = this.freeze;

    this.freezeConfig$ = this.freeze.freezeConfig$;
    this.unfreezeConfig$ = this.freeze.unfreezeConfig$;

    this.contextReaction = new ComponentContextReaction(
      this.store,
      this.rules,
      this.readyLoader,
      this.contextHub,
      (entryId) => this.entryLifecycle.isEntryDestroyed(entryId),
      (configId) => this.freeze.isConfigFrozen(configId),
      (config) => this.store.ready$(config),
    );

    this.contextReaction.start(this.contextHub.change$);
  }

  /** Проверка conditions (видимость, actions, rules) с учётом контекста и типа устройства. */
  conditionsMet(conditions: Condition[]): boolean {
    return this.rules.conditionsMet(conditions);
  }

  /**
   * Регистрирует конфиг и всё дерево вложенных конфигов.
   * @param entryId id корня entry (страница/dialog); для вложенных прокидывается тот же id.
   */
  registerConfig(config: ServerComponentConfig, entryId?: string): void {
    this.store.registerConfig(config, entryId, (cfg, resolvedEntryId) =>
      this.registerConfig(cfg, resolvedEntryId),
    );
  }

  /** К какому entry (страница/dialog/popover) относится конфиг. */
  getEntryId(configId: string): string | undefined {
    return this.store.getEntryId(configId);
  }

  /** Запомнить текущую страницу в router для destroyActivePageEntry. */
  setActivePageEntryId(entryId: string | undefined): void {
    this.entryLifecycle.setActivePageEntryId(entryId);
  }

  /** destroyEntry для активной страницы (перед syncClientState / сменой route). */
  destroyActivePageEntry(): void {
    this.entryLifecycle.destroyActivePageEntry((id) => this.destroyEntry(id));
  }

  /** Публичная обёртка расчёта зависимостей конфига от контекста (тесты, отладка). */
  calculateConfigContextDependencies(config: ServerComponentConfig) {
    return calculateConfigContextDependencies(
      config,
      this.contextHub,
      this.serverComponents,
    );
  }

  /**
   * Уменьшает счётчик использования конфига; при нуле удаляет из hub.
   * Вызывать из page/dialog/popover, а не из ngOnDestroy каждого leaf-компонента.
   */
  deleteConfig(config: ServerComponentConfig): void {
    this.store.deleteConfig(config);
  }

  /** Регистрирует живой ServerComponent; возвращает поток requestRerender$. */
  addInstance(configId: string, instance: ServerComponent<any>) {
    return this.store.addInstance(configId, instance);
  }

  /** Убирает инстанс при destroy компонента. */
  deleteInstance(configId: string, instance: ServerComponent<any>) {
    this.store.deleteInstance(configId, instance);
  }

  /** Поток обновлений конфига по id. */
  config$(id: string) {
    return this.store.config$(id);
  }

  /** Актуальный конфиг; менять только через hub (не мутировать снаружи). */
  getConfigSnapshot(id: string): Readonly<ServerComponentConfig> | undefined {
    return this.store.getConfigSnapshot(id);
  }

  /** Инстансы с точным config id. */
  getInstances(configId: string): ServerComponent<any>[] {
    return this.store.getInstances(configId);
  }

  /** Инстансы по id с сервера (instance id или базовый id всех копий). */
  getInstancesByComponentId(componentId: string): ServerComponent<any>[] {
    return this.store.getInstancesByComponentId(componentId);
  }

  /** Для takeUntil: завершится при destroyEntry этого entry. */
  entryDestroy$(entryId: string): Observable<void> {
    return this.entryLifecycle.entryDestroy$(entryId);
  }

  /** Subtree entry больше не реагирует на change$ (до leave-анимации). */
  destroyEntry(entryId: string): void {
    this.entryLifecycle.destroyEntry(entryId);
  }

  /** Entry уже помечен destroyEntry. */
  isEntryDestroyed(entryId: string): boolean {
    return this.entryLifecycle.isEntryDestroyed(entryId);
  }

  /** Начало закрытия с анимацией — подавить лишний hide из ngOnDestroy. */
  beginEntryDestroy(rootConfigId: string): void {
    this.entryLifecycle.beginEntryDestroy(rootConfigId);
  }

  /** Конец закрытия; парный к beginEntryDestroy. */
  endEntryDestroy(rootConfigId: string): void {
    this.entryLifecycle.endEntryDestroy(rootConfigId);
  }

  /** Глобально: идёт ли сейчас управляемое уничтожение entry. */
  isEntryDestroyActive(): boolean {
    return this.entryLifecycle.isEntryDestroyActive();
  }

  /** Проигрывает animate-component по дереву (type — например hide). */
  animateSubtree(
    configId: string,
    type: string,
    options?: { skipRoot?: boolean },
  ): Promise<Animation[]> {
    return animateSubtree(
      this.store,
      this.serverComponents,
      configId,
      type,
      options,
    );
  }

  /** Заморожен ли конфиг (не слушает контекст). */
  isConfigFrozen(configId: string): boolean {
    return this.freeze.isConfigFrozen(configId);
  }

  /** Заморозить узел и детей (forEach deferred removal). */
  freezeConfigSubtree(config: ServerComponentConfig): void {
    this.freeze.freezeConfigSubtree(config);
  }

  /** Разморозить и пересчитать rules с актуальным контекстом. */
  unfreezeConfigSubtree(config: ServerComponentConfig): void {
    this.freeze.unfreezeConfigSubtree(config);
  }

  /**
   * true, когда все контексты для конфига загружены (и после rerender — снова).
   * Используется в шаблоне: `@if (componentHub.ready$(config) | async)`.
   */
  ready$(config: ServerComponentConfig) {
    return this.store.ready$(config);
  }

  /** После unfreeze: подтянуть overrides, пропущенные пока узел был frozen. */
  private refreshResolvedConfigAfterUnfreeze(configId: string): void {
    const entry = this.store.getEntry(configId);
    if (!entry || this.entryLifecycle.isEntryDestroyed(entry.entryId)) {
      return;
    }
    if (this.rules.updateResolvedConfig(entry, true)) {
      entry.configSubject.next(structuredClone(entry.config));
    }
  }
}
