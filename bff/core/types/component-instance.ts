import { EntryComponent } from "../../components";
import {
  createInstanceLocalActions,
  InstanceLocalActions,
} from "../actions/local-action";
import type { Client } from "../client";
import { currentClient } from "../client-context";
import { tryCurrentEntry } from "../entry-context";
import type { Componentable } from "./componentable";

type ComponentInstanceLocalActions<ComponentType> = ComponentType extends {
  local: infer LocalActions;
}
  ? InstanceLocalActions<LocalActions>
  : Record<string, never>;

/**
 * Инстанс server-компонента на клиенте.
 * Один BFF-объект может быть сериализован несколько раз с разными id (`uuid-0`, `uuid-1`, …).
 */
export class ComponentInstance<
  ComponentType extends Componentable = Componentable,
> {
  private _client?: Client;
  private _entry?: ComponentInstance<EntryComponent>;
  private _serialized = false;
  constructor(
    /** Id инстанса на клиенте (обычно `target` входящего сообщения). */
    readonly id: string,
    readonly component: ComponentType,
  ) {
    this.local = createInstanceLocalActions(
      "local" in component
        ? (component as ComponentType & { local: object }).local
        : undefined,
      id,
    ) as ComponentInstanceLocalActions<ComponentType>;
  }

  /** Локальные действия компонента, адресованные этому instance. */
  readonly local: ComponentInstanceLocalActions<ComponentType>;

  get client(): Client | undefined {
    return this._client;
  }

  /** Entry-инстанс дерева, внутри которого сериализован этот компонент (`entry.component` — BFF entry). */
  get entry(): ComponentInstance<EntryComponent> | undefined {
    return this._entry;
  }

  get serialized(): boolean {
    return this._serialized;
  }

  serialize(): ReturnType<ComponentType["serialize"]> {
    return this.component.serialize(this) as ReturnType<
      ComponentType["serialize"]
    >;
  }

  /** Закрепляет instance за client/entry после успешной сериализации конфига. */
  commitSerialization(): void {
    this._client = currentClient();
    const ownerEntry = tryCurrentEntry();
    this._entry =
      ownerEntry !== undefined && ownerEntry.id === this.id
        ? undefined
        : ownerEntry;
    this._serialized = true;
  }
}
