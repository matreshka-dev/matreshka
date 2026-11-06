import { WebMcpToolCallMessage } from "@matreshka/client-bff-protocol/messages/client-to-bff/webmcp/web-mcp-tool-call-message";
import type { EntryServerComponentConfig } from "@matreshka/client-bff-protocol/types/entry-server-component-config";
import { filter } from "rxjs";
import type { Client } from "../core/client";
import { currentClient } from "../core/client-context";
import { runWithEntry } from "../core/entry-context";
import type { ComponentInstance } from "../core/types/component-instance";
import type { ComponentTreeNode } from "../core/types/component-tree-node";
import type { Componentable } from "../core/types/componentable";
import { incomingMessageObserver } from "../core/utils/incoming-message-observer";
import { serializeComponentList } from "../core/utils/serialize-component-tree";
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
  SerializedConfigType extends
    EntryServerComponentConfig = EntryServerComponentConfig,
> extends Component<InitConfigType, PropertiesType> {
  private readonly registeredTools: WebMcpTool[] = [];
  private declaredToolsRegistered = false;
  private entryLifecycleInteractionsRegistered = false;

  constructor(config: InitConfigType) {
    super(config);
  }

  /**
   * `onEnter` / `onLeave` читаются при первом создании entry-инстанса,
   * уже после конструктора наследника — поля и `this.options` доступны.
   * Дополнительные interaction для того же момента — в {@link registerEntryLifecycleInteractionsExtra}.
   */
  protected registerEntryLifecycleInteractions(): void {
    if (this.entryLifecycleInteractionsRegistered) {
      return;
    }
    this.entryLifecycleInteractionsRegistered = true;
    this.bindDeclaredInteraction("enter", this.onEnter());
    this.bindDeclaredInteraction("leave", this.onLeave());
    this.registerEntryLifecycleInteractionsExtra();
  }

  /** Хук для наследников: один раз сразу после enter/leave (см. {@link registerEntryLifecycleInteractions}). */
  protected registerEntryLifecycleInteractionsExtra(): void {}

  /**
   * Показ entry. По умолчанию — `onEnter` конструктора.
   */
  protected onEnter(): InitConfigType["onEnter"] {
    return this.config.onEnter;
  }

  /**
   * Начало ухода entry. По умолчанию — `onLeave` конструктора.
   */
  protected onLeave(): InitConfigType["onLeave"] {
    return this.config.onLeave;
  }

  /**
   * WebMCP-тулзы entry. По умолчанию — `tools` конструктора.
   * Читается после конструктора наследника: поля наследника уже есть.
   */
  protected tools(): readonly WebMcpTool[] | undefined {
    return this.config.tools;
  }

  /** Сохранённые WebMCP-тулзы. execute не сериализуется и не вызывается до сообщения вызова. */
  get entryTools(): readonly WebMcpTool[] {
    this.registerDeclaredTools();
    return this.registeredTools;
  }

  protected registerEntryTools(tools: readonly WebMcpTool[] | undefined): void {
    if (!tools) {
      return;
    }
    this.registeredTools.push(...tools);
  }

  /** Привязка обработчиков к имени взаимодействия. */
  protected bindDeclaredInteraction(
    event: string,
    handlers:
      | ServerComponentAction<any, any>
      | ServerComponentAction<any, any>[]
      | undefined,
  ): void {
    if (handlers === undefined) {
      return;
    }
    this.bindActions(
      event,
      handlers as
        | ServerComponentAction<Componentable, unknown>
        | ServerComponentAction<Componentable, unknown>[],
    );
  }

  /**
   * Тулзы читают поля наследника, поэтому регистрируются после конструктора:
   * при первом чтении списка и перед сериализацией.
   * Флаг ставится до чтения, чтобы `tools()` мог обратиться к `entryTools`.
   */
  private registerDeclaredTools(): void {
    if (this.declaredToolsRegistered) {
      return;
    }
    this.declaredToolsRegistered = true;
    this.registerEntryTools(this.tools());
  }

  override serialize(instance?: ComponentInstance<this>): SerializedConfigType {
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
  ): SerializedConfigType {
    this.registerDeclaredTools();
    const result = super.serialize(instance);
    const content = this.entryContent();
    return {
      ...result,
      ...(this.registeredTools.length > 0
        ? {
            tools: this.registeredTools.map((tool) => tool.serialize()),
          }
        : {}),
      ...(content
        ? {
            properties: this.buildPropertiesForClient({
              content: serializeComponentList(content),
            }),
          }
        : {}),
    } as SerializedConfigType;
  }

  protected override serializeRuleOverrides(
    overrides: Partial<PropertiesType>,
  ): Record<string, unknown> {
    const out = super.serializeRuleOverrides(overrides);
    const content = (overrides as { content?: readonly ComponentTreeNode[] })
      .content;
    if (content !== undefined) {
      out.content = serializeComponentList(content);
    }
    return out;
  }

  /** Сырое дерево content, если наследник его задаёт. */
  private entryContent(): readonly ComponentTreeNode[] | undefined {
    const content = (this.properties as { content?: unknown }).content;
    return Array.isArray(content)
      ? (content as readonly ComponentTreeNode[])
      : undefined;
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

  /**
   * Явное создание instance entry (редко для Page/Dialog; для App-оверлеев см.
   * {@link beginSerializationContext}). Обработчики enter/leave регистрируются здесь же.
   */
  override createInstance(): ComponentInstance<this> {
    this.registerEntryLifecycleInteractions();
    return super.createInstance();
  }

  protected override createSelfEntry(): ComponentInstance<this> {
    this.registerEntryLifecycleInteractions();
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
