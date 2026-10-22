import { z } from "zod/v4";
import { Context, type JsonObject } from "../../core";

type ItemListIndexContext = Record<string, { index: `${number}` }>;

/** Контекст индексов элементов ItemList; данные не загружаются снаружи. */
export class ItemListIndexStore<
  T extends JsonObject = ItemListIndexContext,
> extends Context<T> {
  initSync() {
    if (!this.inited()) {
      void this.init();
    }
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
