import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItemsSyncMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/components/nested-items/nested-items-sync-message';
import type { NestedItemBase } from '@matreshka/client-bff-protocol/types/nested-item-base';
import type { ServerComponentConfig } from '@matreshka/client-bff-protocol/types/server-component-config';
import {
  diffNestedItems,
  type NestedItemsDiff,
} from '@matreshka/shared/utils/diff-nested-items';
import { filter, map } from 'rxjs';
import { ServerComponent } from '../server-component';
import { syncNestedComponentHubs } from './sync-nested-component-configs';

export type NestedHostItem = NestedItemBase & Record<string, unknown>;

@Component({
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export abstract class NestedItemsHostComponent<
  TConfig extends ServerComponentConfig,
  TItem extends NestedHostItem,
> extends ServerComponent<TConfig> {
  protected readonly nestedItems = signal<TItem[]>([]);
  /** id элемента (track или id статики) → последний известный конфиг. */
  private readonly itemsById = new Map<string, TItem>();
  private readonly itemComponentsCache = new Map<
    string,
    ServerComponentConfig[]
  >();
  private readonly listSyncGeneration = { value: 0 };

  protected abstract nestedItemsSlot(): string;
  protected abstract applyNestedItemsDiff(diff: NestedItemsDiff<TItem>): void;

  override ngOnInit(): void {
    super.ngOnInit();
    this.initNestedItemsFromConfig();
    this.subscribeNestedItemsSync();
  }

  protected itemComponents(item: TItem): ServerComponentConfig[] {
    const existing = this.itemComponentsCache.get(item.id);
    if (existing && existing[0] === item.component) {
      return existing;
    }
    const next = [item.component];
    this.itemComponentsCache.set(item.id, next);
    return next;
  }

  private initNestedItemsFromConfig(): void {
    const slot = this.nestedItemsSlot();
    const items = (
      this.config.properties as Record<string, TItem[] | undefined>
    )[slot];
    if (!items?.length) {
      return;
    }
    const entryId = this.componentHub.getEntryId(this.id());
    if (!entryId) {
      return;
    }
    for (const item of items) {
      this.itemsById.set(item.id, item);
      this.componentHub.registerConfig(item.component, entryId);
    }
    this.nestedItems.set(items);
  }

  /** Сливает upserts в карту и собирает слот в порядке `order`. */
  private materializeNestedItems(
    order: readonly string[],
    upserts: readonly TItem[],
  ): TItem[] {
    for (const item of upserts) {
      this.itemsById.set(item.id, item);
    }
    const next: TItem[] = [];
    const seen = new Set<string>();
    for (const id of order) {
      seen.add(id);
      const item = this.itemsById.get(id);
      if (item) {
        next.push(item);
      }
    }
    for (const id of [...this.itemsById.keys()]) {
      if (!seen.has(id)) {
        this.itemsById.delete(id);
      }
    }
    return next;
  }

  private subscribeNestedItemsSync(): void {
    const slot = this.nestedItemsSlot();
    this.componentCommandMessages$
      .pipe(
        filter(
          (message): message is NestedItemsSyncMessage =>
            message instanceof NestedItemsSyncMessage,
        ),
        filter((message) => message.payload.slot === slot),
        map((message) => message.payload),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((payload) => {
        const previousItems = this.nestedItems();
        const nextItems = this.materializeNestedItems(
          payload.order,
          payload.upserts as TItem[],
        );
        const diff = diffNestedItems(previousItems, nextItems);
        const entryId = this.componentHub.getEntryId(this.id());
        if (entryId) {
          syncNestedComponentHubs({
            entryId,
            previousItems,
            nextItems,
            diff,
            componentHub: this.componentHub,
            listSyncGeneration: this.listSyncGeneration,
            hasHideAnimation: (config) => this.hasHideAnimation(config),
            runHideAnimation: (config) => this.runHideAnimation(config),
          });
        }
        this.nestedItems.set(nextItems);
        this.applyNestedItemsDiff(diff);
        this.cdr.markForCheck();
      });
  }

  private hasHideAnimation(config: ServerComponentConfig): boolean {
    return (
      config.interactions?.['hide']?.some(
        (interaction) => interaction.class === 'animate-component',
      ) ?? false
    );
  }

  private runHideAnimation(config: ServerComponentConfig): Promise<void> {
    const instances = this.componentHub.getInstances(config.id);
    if (instances.length === 0) {
      return Promise.resolve();
    }
    return instances[0].animateInteraction('hide').then(() => undefined);
  }
}
