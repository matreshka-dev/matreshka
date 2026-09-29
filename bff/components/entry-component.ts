import { AppDestroyEntryInstanceMessage } from "@matreshka/shared/messages/client-to-bff/app/app-destroy-entry-instance-message";
import { filter } from "rxjs";
import { z } from "zod";
import type { Client } from "../core/client";
import { currentClient } from "../core/client-context";
import { runWithEntry } from "../core/entry-context";
import type { ComponentInstance } from "../core/types/component-instance";
import type { Componentable } from "../core/types/componentable";
import { incomingMessageObserver } from "../core/utils/incoming-message-observer";
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
    // Явное подписываение на сообщения от клиента, потому что нужно отслеживать сообщение о закрытии
    if (!this.usingByClient(client)) {
      this.subscribeClientEvents(client);
    }
    return instance;
  }

  override subscribeClientEvents(client: Client) {
    super.subscribeClientEvents(client);
    this.clientSubscriptions.get(client)!.add(
      client.incomingMessage$
        .pipe(
          filter(
            (message) => message instanceof AppDestroyEntryInstanceMessage,
          ),
        )
        .subscribe(
          incomingMessageObserver(client, (unsafeMessage) => {
            const messagePayload = z
              .object({ id: z.string() })
              .parse(unsafeMessage.payload);
            const instanceIndex = this.instances.findIndex(
              (instance) => instance.id === messagePayload.id,
            );
            if (instanceIndex === -1) {
              return;
            }
            if (this.instances[instanceIndex].client !== client) {
              return;
            }
            this.releaseInstances([this.instances[instanceIndex]]);
          }),
        ),
    );
  }
}
