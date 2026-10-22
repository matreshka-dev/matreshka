import { BehaviorSubject } from "rxjs";
import { z } from "zod/v4";
import { Context, type JsonObject } from "../../core";

type ItemListIndexContext = Record<string, { index: `${number}` }>;

/** Контекст индексов элементов ItemList; данные не загружаются снаружи. */
export class ItemListIndexStore<
  T extends JsonObject = ItemListIndexContext,
> extends Context<T> {
  /**
   * Синхронно поднимает хранилище до async {@link init}, чтобы `replace` в serialize
   * не перезаписывался пустым `{}` из `initDataCallback`.
   */
  initSync() {
    if (this.inited()) {
      return this;
    }
    this.data$ = new BehaviorSubject({} as T);
    this.subscribeToDataChanges();
    return this;
  }

  constructor(preload: boolean) {
    super({
      data: async () => ({}) as Promise<T>,
      preload,
      schema: z.strictObject({}),
    });
  }
}
