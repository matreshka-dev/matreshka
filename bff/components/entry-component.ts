import { currentClient } from "../core/client-context";
import { runWithEntry } from "../core/entry-context";
import type { ComponentInstance } from "../core/types/component-instance";
import type { Componentable } from "../core/types/componentable";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
  ServerComponentAction,
} from "./component";

/**
 * Конфигурация инициализации для EntryComponent без поля conditions
 */
export type EntryComponentInitConfig<
  ComponentType extends Componentable,
  PropertiesType extends EntryComponentProperties = EntryComponentProperties,
> = Omit<
  ComponentInitConfig<ComponentType, PropertiesType>,
  "conditions" | "onShow" | "onHide"
> & {
  onEnter?:
    | EntryComponentAction<ComponentType>
    | EntryComponentAction<ComponentType>[];
  onLeave?: EntryLeaveAction<ComponentType> | EntryLeaveAction<ComponentType>[];
};

export type EntryComponentAction<ComponentType extends Componentable> =
  ServerComponentAction<ComponentType, undefined>;

export type EntryLeaveAction<ComponentType extends Componentable> =
  ServerComponentAction<ComponentType, undefined>;

/**
 * Собственные свойства EntryComponent (пока совпадают с базовыми)
 */
export type EntryComponentProperties = ComponentProperties;

type DefaultInitConfigType = EntryComponentInitConfig<EntryComponent>;

/**
 * Абстрактный компонент-входная точка, наследует поведение базового Component
 * и типы состояний/свойств/инициализации (кроме поля conditions).
 */
export abstract class EntryComponent<
  InitConfigType extends EntryComponentInitConfig<any> = DefaultInitConfigType,
  PropertiesType extends EntryComponentProperties = EntryComponentProperties,
> extends Component<InitConfigType, PropertiesType> {
  constructor(config: InitConfigType) {
    super(config);
    if (config.onEnter) {
      this.bindActions(
        "enter",
        config.onEnter as unknown as
          | ServerComponentAction<Componentable, unknown>
          | ServerComponentAction<Componentable, unknown>[],
      );
    }
    if (config.onLeave) {
      this.bindActions(
        "leave",
        config.onLeave as unknown as
          | ServerComponentAction<Componentable, unknown>
          | ServerComponentAction<Componentable, unknown>[],
      );
    }
  }

  override serialize(instance?: ComponentInstance<this>) {
    return this.withEntrySerializationContext(instance, (resolvedInstance) =>
      this.serializeEntry(resolvedInstance),
    );
  }

  /** @internal */
  protected withEntrySerializationContext<T>(
    instance: ComponentInstance<this> | undefined,
    fn: (instance: ComponentInstance<this>) => T,
  ): T {
    if (instance?.serialized) {
      throw new Error(
        "Instance already serialized. Create new instance instead.",
      );
    }
    if (!instance) {
      instance = this.createSelfEntry();
      return runWithEntry(instance, () => fn(instance!));
    }
    return fn(instance);
  }

  protected serializeEntry(instance: ComponentInstance<this>) {
    return super.serialize(instance);
  }

  /** Контекст сериализации дочерних компонентов без полной serialize entry. @internal */
  beginSerializationContext(): ComponentInstance<this> {
    return this.createSelfEntry();
  }

  protected override createSelfEntry(): ComponentInstance<this> {
    const instance = super.createSelfEntry();
    const client = currentClient();
    // Подписка на leave и прочие interaction до commitSerialization instance.entry.
    if (!this.usingByClient(client)) {
      this.subscribeClientEvents(client);
    }
    return instance;
  }

  protected override emitInteraction(
    type: string,
    payload: unknown,
    instance: ComponentInstance<this>,
    handlers: number[],
  ): void {
    super.emitInteraction(type, payload, instance, handlers);
    if (type === "leave") {
      this.releaseInstances([instance]);
    }
  }
}
