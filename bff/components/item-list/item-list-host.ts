import type { NestedItemBase } from "@matreshka/shared/types/nested-item-base";

/** Host map/board, принимающий flat nested-items с wire. */
export type ItemListHost = {
  /** Отправляет клиенту обновлённый flat-массив slot'а. */
  syncNestedItems(slot: string, items: NestedItemBase[]): void;
  /** Пересобирает весь slot после изменения сегмента itemList. */
  resyncNestedSlot(slot: string): void;
  /** Активные instances host-кomponenta на клиенте. */
  readonly hostInstances: readonly import("../../core").ComponentInstance[];
};
