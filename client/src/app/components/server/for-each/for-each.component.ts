import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ForEachSyncComponentsMessage } from '@shared/messages/bff-to-client/components/for-each/for-each-sync-components-message';
import type { ForEachConfig } from '@shared/types/for-each-config';
import { filter, map, takeUntil } from 'rxjs';
import { SsrService } from '../../../services/ssr.service';
import { ContextChangeEvent } from '../../../types/context-change-event';
import { parseContextPath } from '../../../utils/parse-context-path';
import { ServerComponent } from '../server-component';
import { ServerComponentConfig } from '../server-component-config';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';
import {
  reverseComponentAnimations,
  selectAnimationsToReverse,
} from '../utils/run-component-animations';

@Component({
  selector: 'app-for-each',
  imports: [forwardRef(() => ServerComponentsListComponent)],
  templateUrl: './for-each.component.html',
  styleUrl: './for-each.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'for-each',
  },
})
export class ForEachComponent
  extends ServerComponent<ForEachConfig>
  implements OnInit
{
  ssr = inject(SsrService);
  componentsInitTask = this.ssr.addTask();
  elementsComponents = signal<ServerComponentConfig[][]>([]);
  /** Отсекает устаревший deferred hide при быстром ListSync. */
  private listSyncGeneration = 0;
  /** Скелет списка (длина и порядок track-ключей) для отличия структуры от полей элементов. */
  private lastListStructureChecksum = '';

  override ngOnInit() {
    super.ngOnInit();
    this.subscribeListRefFreeze();
    this.refreshListStructureChecksum();
    if (this.config.properties.components) {
      const components = this.config.properties
        .components as ServerComponentConfig[][];
      this.syncComponentConfigs(components);
      // Очищаем задачу инициализации компонентов при получении их от сервера
      this.ssr.cleanupTask(this.componentsInitTask);
    }
    this.componentCommandMessages$
      .pipe(
        filter(
          (message): message is ForEachSyncComponentsMessage =>
            message instanceof ForEachSyncComponentsMessage,
        ),
        map((message) => message.payload),
      )
      .subscribe((components: ServerComponentConfig[][]) => {
        this.syncComponentConfigs(components);
        if (!this.config.properties.components) {
          // Если компоненты не были переданы в конфигурацию, то очищаем задачу инициализации компонентов при получении их от сервера
          this.ssr.cleanupTask(this.componentsInitTask);
        }
      });
  }

  syncComponentConfigs(components: ServerComponentConfig[][]): void {
    const generation = ++this.listSyncGeneration;
    const previous = this.elementsComponents();

    const nextComponentIds = new Set(
      components.flat().map((component) => component.id),
    );
    const previousComponents = previous.flat();
    const removed = previousComponents.filter(
      (component) => !nextComponentIds.has(component.id),
    );
    const deferredRemoved = removed.filter((component) =>
      this.hasHideAnimation(component),
    );
    const deferredRemovedIds = new Set(
      deferredRemoved.map((component) => component.id),
    );

    for (const component of previousComponents) {
      if (nextComponentIds.has(component.id)) {
        this.componentHub.unfreezeConfigSubtree(component);
        this.reverseInFlightHideIfRestored(component);
      }
    }
    for (const component of deferredRemoved) {
      this.componentHub.freezeConfigSubtree(component);
    }

    const entryId = this.componentHub.getEntryId(this.id());
    const registerNextConfigs = () => {
      components.forEach((elementComponents) => {
        elementComponents.forEach((component) => {
          this.componentHub.registerConfig(component, entryId);
        });
      });
    };

    const deleteRemovedConfigs = (configIds: Set<string>) => {
      previousComponents.forEach((component) => {
        if (configIds.has(component.id)) {
          this.componentHub.deleteConfig(component);
        }
      });
    };

    if (deferredRemovedIds.size === 0) {
      registerNextConfigs();
      deleteRemovedConfigs(
        new Set(
          previousComponents
            .filter((component) => !nextComponentIds.has(component.id))
            .map((component) => component.id),
        ),
      );
      this.setElementsComponents(components);
      return;
    }

    // Без hide — удаляем сразу; deferred строки остаются в hub и DOM до конца анимации.
    previousComponents.forEach((component) => {
      if (deferredRemovedIds.has(component.id)) {
        return;
      }
      if (!nextComponentIds.has(component.id)) {
        this.componentHub.deleteConfig(component);
      }
    });

    void Promise.all(
      deferredRemoved.map((component) => this.runHideAnimation(component)),
    ).then(() => {
      if (generation !== this.listSyncGeneration) {
        return;
      }
      registerNextConfigs();
      this.setElementsComponents(components);
      deleteRemovedConfigs(deferredRemovedIds);
    });
  }

  /** Есть ли у конфига клиентская hide-анимация (BFF: onHide → animate-component). */
  private hasHideAnimation(config: ServerComponentConfig): boolean {
    return (
      config.interactions?.['hide']?.some(
        (interaction) => interaction.class === 'animate-component',
      ) ?? false
    );
  }

  /** Строка вернулась в ListSync до завершения leave — разворачиваем hide. */
  private reverseInFlightHideIfRestored(config: ServerComponentConfig): void {
    const instances = this.componentHub.getInstances(config.id);
    if (instances.length === 0) {
      return;
    }
    const element = instances[0].animationElement();
    const toReverse = selectAnimationsToReverse(element, true);
    if (toReverse.length > 0) {
      void reverseComponentAnimations(toReverse);
    }
  }

  /** Hide через WAAPI; deleteConfig — только после снятия строки из @for. */
  private runHideAnimation(config: ServerComponentConfig): Promise<void> {
    const instances = this.componentHub.getInstances(config.id);
    if (instances.length === 0) {
      return Promise.resolve();
    }
    return instances[0].animateInteraction('hide').then(() => undefined);
  }

  setElementsComponents(components: ServerComponentConfig[][]): void {
    this.elementsComponents.set(components);
    this.refreshListStructureChecksum();
  }

  /**
   * Контекст списка обновляется раньше ListSync — замораживаем
   * текущие строки, чтобы ref не подставил чужие данные до leave-анимации.
   * Обновление полей внутри элементов (progress, name и т.д.) не замораживает:
   * иначе output/input перестают реагировать, т.к. ListSync при том же track не приходит.
   */
  private subscribeListRefFreeze(): void {
    const entryId = this.componentHub.getEntryId(this.id())!;
    this.contextHub.change$
      .pipe(
        takeUntil(this.componentHub.entryDestroy$(entryId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((payload) => {
        const listRef = this.config.properties.ref;
        if (!listRef || !this.listRefChangeAffectsForEach(payload, listRef)) {
          return;
        }
        const list: unknown = this.contextHub.value(listRef);
        const structureChecksum = this.computeListStructureChecksum(list);
        if (structureChecksum === this.lastListStructureChecksum) {
          return;
        }
        this.lastListStructureChecksum = structureChecksum;
        for (const row of this.elementsComponents().flat()) {
          this.componentHub.freezeConfigSubtree(row);
        }
      });
  }

  private refreshListStructureChecksum(): void {
    const listRef = this.config.properties.ref;
    if (!listRef) {
      return;
    }
    const pathInfo = parseContextPath(listRef);
    if (!this.contextHub.loaded(pathInfo.contextId)) {
      return;
    }
    this.lastListStructureChecksum = this.computeListStructureChecksum(
      this.contextHub.value(listRef),
    );
  }

  private computeListStructureChecksum(list: unknown): string {
    if (!Array.isArray(list)) {
      return '';
    }
    return list
      .map((item, index) => this.listItemTrackKey(item, index))
      .join('|');
  }

  private listItemTrackKey(item: unknown, index: number): string {
    if (item !== null && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      if (
        typeof record['key'] === 'string' ||
        typeof record['key'] === 'number'
      ) {
        return String(record['key']);
      }
      if (
        typeof record['id'] === 'string' ||
        typeof record['id'] === 'number'
      ) {
        return String(record['id']);
      }
    }
    return String(index);
  }

  private listRefChangeAffectsForEach(
    payload: ContextChangeEvent,
    listRef: string,
  ): boolean {
    const pathInfo = parseContextPath(listRef);
    if (payload.contextId !== pathInfo.contextId) {
      return false;
    }
    const listKey = pathInfo.key;
    if (!listKey) {
      return payload.values.length > 0;
    }
    return payload.values.some(
      (value) =>
        value.key === listKey ||
        value.key.startsWith(`${listKey}.`) ||
        listKey.startsWith(`${value.key}.`),
    );
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.elementsComponents().forEach((elementComponents) => {
      elementComponents.forEach((component) => {
        this.componentHub.deleteConfig(component);
      });
    });
  }
}
