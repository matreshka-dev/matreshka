import { ServerComponentClass } from "../enums/server-component-class";
import type { ServerComponentConfig } from "./server-component-config";

/** Строка ForEach, которую клиент хранит по ключу `track`. */
export type ForEachSyncedItem = {
  key: string;
  components: ServerComponentConfig[];
};

/**
 * Полный порядок ключей и конфиги только тех ключей, которых у этого instance клиента ещё нет.
 * Тот же объект уходит в preload (`properties.components`) и в `ForEachSyncComponentsMessage`.
 */
export type ForEachSyncComponentsPayload = {
  order: string[];
  upserts: ForEachSyncedItem[];
};

export type ForEachConfig = {
  class: ServerComponentClass.ForEach;
  properties: {
    ref: string;
    components?: ForEachSyncComponentsPayload;
    componentContext: string;
    divider?: ServerComponentConfig[];
  };
} & ServerComponentConfig;
