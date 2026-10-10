/**
 * Refcount удержания contextId на клиенте (потребители — узлы ComponentConfigStore).
 * Пока счётчик > 0, ContextHub не выкидывает snapshot после context-destroy с BFF.
 */
export class ContextHoldRegistry {
  private readonly counts = new Map<string, number>();

  /** Увеличить число потребителей contextId. */
  retain(contextId: string): void {
    if (!contextId) {
      return;
    }
    this.counts.set(contextId, (this.counts.get(contextId) ?? 0) + 1);
  }

  /**
   * Уменьшить число потребителей.
   * @returns новое значение счётчика (0 — последний hold снят).
   */
  release(contextId: string): number {
    if (!contextId) {
      return 0;
    }
    const current = this.counts.get(contextId) ?? 0;
    if (current <= 1) {
      this.counts.delete(contextId);
      return 0;
    }
    const next = current - 1;
    this.counts.set(contextId, next);
    return next;
  }

  holdCount(contextId: string): number {
    return this.counts.get(contextId) ?? 0;
  }
}
