import { Injectable } from '@angular/core';
import type {
  ConfigEntry,
  PathContextDependency,
} from './component-config-entry.types';

/**
 * Зависимости конфигов от contextId и глобальный refcount потребителей на клиенте.
 *
 * Для каждого ConfigEntry хранит heldContextIds и синхронизирует их с общей map
 * (сколько конфигов в ComponentHub сейчас ссылаются на каждый contextId).
 *
 * После context-destroy на BFF snapshot живёт, пока счётчик > 0.
 * ContextHub читает holdCount при destroy; при последнем снятии hold вызывается
 * bindEvictHandler (обычно evict pending snapshot).
 */
@Injectable({
  providedIn: 'root',
})
export class ComponentContextDependencyHolds {
  private readonly consumerCountByContextId = new Map<string, number>();
  private onLastConsumerReleased?: (contextId: string) => void;

  /**
   * Один раз при старте ContextHub: что делать, когда по contextId не осталось потребителей.
   */
  bindEvictHandler(handler: (contextId: string) => void): void {
    this.onLastConsumerReleased = handler;
  }

  /**
   * Вызывается, когда ConfigEntry удаляют из store (useCount стал 0).
   * Снимает все holds этого entry и обнуляет heldContextIds.
   */
  releaseAll(entry: ConfigEntry): void {
    this.applyHoldDiff(entry.heldContextIds, new Set());
    entry.heldContextIds = new Set();
  }

  /**
   * Обновляет конфиг через rules (applyRules) и синхронизирует hold по полному
   * набору contextId (базовый конфиг + все rules, см. resolveHoldContextIds).
   *
   * @param applyRules обычно ComponentConfigRules.updateResolvedConfig
   * @param resolveHoldContextIds calculateEntryHoldContextIds из component-config-dependencies
   * @returns true, если rules изменили resolved config (как у applyRules)
   */
  updateResolvedConfigWithHolds(
    entry: ConfigEntry,
    force: boolean,
    applyRules: (entry: ConfigEntry, force: boolean) => boolean,
    resolveHoldContextIds: (entry: ConfigEntry) => Set<string>,
  ): boolean {
    const previousHeld = new Set(entry.heldContextIds);
    const changed = applyRules(entry, force);
    const nextHeld = resolveHoldContextIds(entry);
    this.applyHoldDiff(previousHeld, nextHeld);
    entry.heldContextIds = nextHeld;
    return changed;
  }

  /**
   * Какие contextId entry сейчас учитывает в счётчике после последней синхронизации.
   * Удобно в тестах и при отладке.
   */
  getTrackedContextIds(entry: ConfigEntry): ReadonlySet<string> {
    return entry.heldContextIds;
  }

  /** Сколько конфигов в hub сейчас ссылаются на contextId. */
  holdCount(contextId: string): number {
    return this.consumerCountByContextId.get(contextId) ?? 0;
  }

  /**
   * Добавить одного потребителя contextId.
   * В приложении — только из applyHoldDiff; в тестах ContextHub — симуляция hold конфига.
   */
  addConsumer(contextId: string): void {
    if (!contextId) {
      return;
    }
    this.consumerCountByContextId.set(
      contextId,
      (this.consumerCountByContextId.get(contextId) ?? 0) + 1,
    );
  }

  /**
   * Снять одного потребителя; при переходе в 0 вызывает bindEvictHandler.
   * В приложении — только из applyHoldDiff; в тестах ContextHub — симуляция release.
   */
  removeConsumer(contextId: string): void {
    if (!contextId) {
      return;
    }
    const current = this.consumerCountByContextId.get(contextId) ?? 0;
    if (current <= 1) {
      this.consumerCountByContextId.delete(contextId);
      this.onLastConsumerReleased?.(contextId);
      return;
    }
    this.consumerCountByContextId.set(contextId, current - 1);
  }

  /** Собирает уникальные contextId из карты runtime-зависимостей (resolved config). */
  static extractContextIds(
    contextDependencies: Map<string, PathContextDependency[]>,
  ): Set<string> {
    const ids = new Set<string>();
    contextDependencies.forEach((deps) => {
      deps.forEach((dep) => {
        ids.add(dep.contextId);
      });
    });
    return ids;
  }

  /**
   * Сравнивает два набора contextId: что появилось (added) и что исчезло (removed).
   */
  static diffContextIdSets(
    prev: Set<string>,
    next: Set<string>,
  ): { added: string[]; removed: string[] } {
    const added: string[] = [];
    const removed: string[] = [];
    next.forEach((id) => {
      if (!prev.has(id)) {
        added.push(id);
      }
    });
    prev.forEach((id) => {
      if (!next.has(id)) {
        removed.push(id);
      }
    });
    return { added, removed };
  }

  /** Уменьшает счётчик для removed, увеличивает для added. */
  private applyHoldDiff(prev: Set<string>, next: Set<string>): void {
    const { added, removed } =
      ComponentContextDependencyHolds.diffContextIdSets(prev, next);
    removed.forEach((id) => this.removeConsumer(id));
    added.forEach((id) => this.addConsumer(id));
  }
}
