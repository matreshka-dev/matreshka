import { WebMcpToolCallMessage } from "@matreshka/shared/messages/client-to-bff/webmcp/web-mcp-tool-call-message";
import type { EntryServerComponentConfig } from "@matreshka/shared/types/entry-server-component-config";
import { filter } from "rxjs";
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
import { dispatchWebMcpToolCall, type WebMcpTool } from "./webmcp/web-mcp-tool";

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
  tools?: WebMcpTool[];
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
  private readonly registeredTools: WebMcpTool[] = [];

  constructor(config: InitConfigType) {
    super(config);
    this.registerEntryTools(config.tools);
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

  /** Сохранённые WebMCP-тулзы. execute не сериализуется и не вызывается до сообщения вызова. */
  get entryTools(): readonly WebMcpTool[] {
    return this.registeredTools;
  }

  protected registerEntryTools(tools: readonly WebMcpTool[] | undefined): void {
    if (!tools) {
      return;
    }
    this.registeredTools.push(...tools);
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

  protected serializeEntry(
    instance: ComponentInstance<this>,
  ): EntryServerComponentConfig {
    const result = super.serialize(instance);
    if (this.registeredTools.length === 0) {
      return result;
    }
    return {
      ...result,
      tools: this.registeredTools.map((tool) => tool.serialize()),
    };
  }

  protected override subscribeClientEvents(client: Client): void {
    super.subscribeClientEvents(client);
    const sub = this.clientSubscriptions.get(client);
    if (!sub) {
      return;
    }
    sub.add(
      client.incomingMessage$
        .pipe(
          filter(
            (message): message is WebMcpToolCallMessage =>
              message instanceof WebMcpToolCallMessage,
          ),
        )
        .subscribe(
          incomingMessageObserver(client, (message) => {
            const tool = this.registeredTools.find(
              (item) => item.id === message.target,
            );
            if (!tool) {
              return;
            }
            void dispatchWebMcpToolCall(
              client,
              tool,
              message.id,
              message.payload?.input,
            ).catch((error) => {
              client.error$.next(error);
            });
          }),
        ),
    );
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
