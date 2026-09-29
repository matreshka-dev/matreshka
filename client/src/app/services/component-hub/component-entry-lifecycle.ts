import { EMPTY, Observable, Subject } from 'rxjs';

/**
 * Жизненный цикл «entry» — корня страницы, dialog или popover:
 * когда subtree уже не должен реагировать на контекст и когда подавлять hide в destroy.
 */
export class ComponentEntryLifecycle {
  private entryDestroyCounts = new Map<string, number>();
  private entryDestroySubjects = new Map<string, Subject<void>>();
  private destroyedEntryIds = new Set<string>();
  private activePageEntryId?: string;

  /** Запоминает id текущей страницы в router (для destroy при навигации). */
  setActivePageEntryId(entryId: string | undefined): void {
    this.activePageEntryId = entryId;
  }

  /** Вызывает destroyEntry для активной страницы (NavigationStart / sync с BFF). */
  destroyActivePageEntry(destroyEntry: (entryId: string) => void): void {
    if (this.activePageEntryId) {
      destroyEntry(this.activePageEntryId);
    }
  }

  /**
   * Поток для takeUntil: завершится, когда entry уничтожен (route/dialog close).
   * Для уже уничтоженного entry сразу EMPTY.
   */
  entryDestroy$(entryId: string): Observable<void> {
    if (this.destroyedEntryIds.has(entryId)) {
      return EMPTY;
    }
    let subject = this.entryDestroySubjects.get(entryId);
    if (!subject) {
      subject = new Subject<void>();
      this.entryDestroySubjects.set(entryId, subject);
    }
    return subject.asObservable();
  }

  /** Помечает entry уничтоженным и завершает entryDestroy$. */
  destroyEntry(entryId: string): void {
    if (this.destroyedEntryIds.has(entryId)) {
      return;
    }
    this.destroyedEntryIds.add(entryId);
    const subject = this.entryDestroySubjects.get(entryId);
    if (subject) {
      subject.next();
      subject.complete();
      this.entryDestroySubjects.delete(entryId);
    }
  }

  /** Entry уже отписан от hub (не обрабатывать change$). */
  isEntryDestroyed(entryId: string): boolean {
    return this.destroyedEntryIds.has(entryId);
  }

  /**
   * Начало «мягкого» destroy (анимация закрытия): ngOnDestroy не шлёт hide на сервер.
   * Счётчик для вложенных begin/end.
   */
  beginEntryDestroy(rootConfigId: string): void {
    this.entryDestroyCounts.set(
      rootConfigId,
      (this.entryDestroyCounts.get(rootConfigId) ?? 0) + 1,
    );
  }

  /** Конец мягкого destroy; флаг снимается, когда счётчик дошёл до нуля. */
  endEntryDestroy(rootConfigId: string): void {
    const count = this.entryDestroyCounts.get(rootConfigId);
    if (count === undefined) {
      return;
    }
    if (count <= 1) {
      this.entryDestroyCounts.delete(rootConfigId);
      return;
    }
    this.entryDestroyCounts.set(rootConfigId, count - 1);
  }

  /** Идёт ли сейчас хотя бы один beginEntryDestroy без end. */
  isEntryDestroyActive(): boolean {
    return this.entryDestroyCounts.size > 0;
  }

  /** Сброс destroy-состояния корневого entry при deleteConfig (можно снова открыть тот же id). */
  clearRootEntryDestroyState(entryId: string): void {
    this.destroyedEntryIds.delete(entryId);
    this.entryDestroySubjects.get(entryId)?.complete();
    this.entryDestroySubjects.delete(entryId);
  }
}
