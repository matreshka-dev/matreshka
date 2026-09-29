import { Observable, Subject } from 'rxjs';
import type { ComponentDependencies } from '../../components/server/server-component-config';
import { ServerComponentConfig } from '../../components/server/server-component-config';

type ServerComponentSettings = Record<
  string,
  { dependencies: ComponentDependencies }
>;

/**
 * Временная «заморозка» конфигов (forEach при удалении строк):
 * пока frozen, change$ контекста не меняет config и не ререндерит узел.
 */
export class ComponentConfigFreeze {
  private frozenConfigIds = new Set<string>();
  private readonly freezeConfigSubject = new Subject<string>();
  private readonly unfreezeConfigSubject = new Subject<string>();

  /** Id конфига, который только что заморозили (для ServerComponent). */
  readonly freezeConfig$: Observable<string> =
    this.freezeConfigSubject.asObservable();
  /** Id конфига, с которого сняли заморозку. */
  readonly unfreezeConfig$: Observable<string> =
    this.unfreezeConfigSubject.asObservable();

  constructor(
    private readonly serverComponents: ServerComponentSettings,
    private readonly refreshResolvedConfigAfterUnfreeze: (
      configId: string,
    ) => void,
  ) {}

  /** Заморожен ли этот config id. */
  isConfigFrozen(configId: string): boolean {
    return this.frozenConfigIds.has(configId);
  }

  /** Замораживает конфиг и все вложенные в дереве. */
  freezeConfigSubtree(config: ServerComponentConfig): void {
    const visit = (cfg: ServerComponentConfig) => {
      if (this.frozenConfigIds.has(cfg.id)) {
        return;
      }
      this.frozenConfigIds.add(cfg.id);
      this.freezeConfigSubject.next(cfg.id);
      this.getEntrySettings(cfg)
        .dependencies.getNestedConfigsPaths(cfg)
        .forEach(visit);
    };
    visit(config);
  }

  /** Снимает заморозку с поддерева и пересчитывает rules для каждого узла. */
  unfreezeConfigSubtree(config: ServerComponentConfig): void {
    const visit = (cfg: ServerComponentConfig) => {
      if (!this.frozenConfigIds.delete(cfg.id)) {
        return;
      }
      this.unfreezeConfigSubject.next(cfg.id);
      this.refreshResolvedConfigAfterUnfreeze(cfg.id);
      this.getEntrySettings(cfg)
        .dependencies.getNestedConfigsPaths(cfg)
        .forEach(visit);
    };
    visit(config);
  }

  /** Убирает id из множества frozen при deleteConfig (без unfreeze-событий). */
  releaseFrozenState(configId: string): void {
    this.frozenConfigIds.delete(configId);
  }

  private getEntrySettings(config: ServerComponentConfig) {
    return this.serverComponents[config.class];
  }
}
