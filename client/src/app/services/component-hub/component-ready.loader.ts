import {
  filter,
  firstValueFrom,
  forkJoin,
  Observable,
  ReplaySubject,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import { ServerComponentConfig } from '../../components/server/server-component-config';
import type { ContextHubService } from '../context-hub.service';
import type { ConfigEntry } from './component-config-entry.types';

/** Пересчёт rules/deps entry; в hub обёрнут sync holds. */
export type UpdateEntryResolvedConfig = (
  entry: ConfigEntry,
  force?: boolean,
) => boolean;

/**
 * Загрузка контекстов, от которых зависит конфиг, и поток ready$.
 * При rerender запускает новый цикл загрузки без «отвала» старых подписчиков.
 */
export class ComponentReadyLoader {
  constructor(
    private readonly contextHub: ContextHubService,
    private readonly updateResolvedConfig: UpdateEntryResolvedConfig,
  ) {}

  /**
   * Долгоживущий поток: при каждом readyReload$ — новый цикл init контекстов,
   * в конце эмит `true` (важно для `@if (ready$ | async)`).
   */
  createReady$(entry: ConfigEntry): Observable<true> {
    return entry.readyReload$.pipe(
      startWith(void 0),
      switchMap(() => {
        const subject = new ReplaySubject<true>(1);
        this.loadRequiredContextsForEntry(entry, subject);
        return subject;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  /**
   * Ждёт завершения нового цикла загрузки после readyReload$.
   * Игнорирует старое закешированное true из shareReplay (смотрит readyGeneration).
   */
  rerender$(
    entry: ConfigEntry,
    ready: (config: ServerComponentConfig) => Observable<true>,
  ) {
    const startGeneration = entry.readyGeneration;
    entry.readyReload$.next();
    return ready(entry.config).pipe(
      filter(() => entry.readyGeneration > startGeneration),
      take(1),
    );
  }

  /**
   * Порциями грузит незагруженные contextId из contextDependencies,
   * пересчитывает rules/зависимости (могут появиться вложенные плейсхолдеры).
   * При ошибке init — лог и повтор через 1 с.
   */
  loadRequiredContextsForEntry(
    entry: ConfigEntry,
    result: ReplaySubject<true>,
  ): void {
    const loadBatch = (contextIds: string[]) =>
      forkJoin(
        contextIds.map((contextId) =>
          this.contextHub.init$(contextId).pipe(take(1)),
        ),
      );

    const loadAll = async () => {
      for (;;) {
        this.updateResolvedConfig(entry);
        const requiredContexts = this.getEntryRequiredContexts(entry).filter(
          (contextId) => !this.contextHub.loaded(contextId),
        );

        if (requiredContexts.length === 0) {
          entry.readyGeneration++;
          result.next(true);
          break;
        }

        try {
          await firstValueFrom(loadBatch(requiredContexts));
          this.updateResolvedConfig(entry, true);
          entry.configSubject.next(structuredClone(entry.config));
        } catch (error) {
          console.error(
            'Failed to load required contexts for component config, will retry:',
            entry.config.id,
            error,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    };

    void loadAll();
  }

  /** Уникальные contextId из всех зависимостей entry. */
  private getEntryRequiredContexts(entry: ConfigEntry): string[] {
    const contextIds = new Set<string>();
    entry.contextDependencies.forEach((deps) => {
      deps.forEach((dep) => {
        contextIds.add(dep.contextId);
      });
    });
    return Array.from(contextIds);
  }
}
