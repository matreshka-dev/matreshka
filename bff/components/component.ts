import { componentBaseId } from "@matreshka/shared";
import { ColorRole } from "@matreshka/shared/enums/color-role";
import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { TextAlign } from "@matreshka/shared/enums/text-align";
import { TextDecoration } from "@matreshka/shared/enums/text-decoration";
import { ComponentCommandMessage } from "@matreshka/shared/messages/bff-to-client/component-command-message";
import { ComponentInteractionMessage } from "@matreshka/shared/messages/client-to-bff/components/component-interaction-message";
import { ColorToken } from "@matreshka/shared/types/color-token";
import type { FontStackToken } from "@matreshka/shared/types/fonts";
import type { GridItem } from "@matreshka/shared/types/grid-item";
import type { ServerComponentConfig } from "@matreshka/shared/types/server-component-config";
import type { ServerComponentInteraction } from "@matreshka/shared/types/server-component-interaction";
import * as crypto from "node:crypto";
import { filter, Subject, Subscription } from "rxjs";
import {
  Action,
  Client,
  colorTokenId,
  resolvePartialColorsToIds,
  Componentable,
  ComponentInstance,
  currentClient,
  LocalAction,
  runWithClient,
  SerializedComponentRule,
  tryCurrentEntry,
} from "../core";
import { Condition } from "../core/conditions";
import { incomingMessageObserver } from "../core/utils/incoming-message-observer";
import { trackCreatedInstance } from "../core/utils/track-created-instances";
import { ServerAction, ServerActionHandler } from "./actions/server-action";
import type { EntryComponent } from "./entry-component";
/**
 * @prop colors - Цветовые схемы для раскраски
 * @prop font - Stack token для сборки CSS-свойств шрифта
 * @prop scale - масштаб компонента
 * @prop textAlign - горизонтальное выравнивание текста компонента и его потомков
 * @prop textDecoration - оформление текста (подчёркивание, зачёркивание)
 * @prop gridItem - настройки размещения элемента, когда он находится внутри grid
 * @prop link - адрес перехода при клике на компонент
 */
export type ComponentProperties = {
  colors?: Partial<Record<ColorRole, string>>;
  font?: FontStackToken;
  scale?: number;
  textAlign?: TextAlign;
  textDecoration?: TextDecoration;
  /** Настройки размещения элемента, когда он находится внутри grid. */
  gridItem?: GridItem;
  /** Адрес перехода при клике на компонент. */
  link?: {
    value: string;
  };
};

/**
 * Переопределения в {@link ComponentInitConfig.rules}: те же поля, что у свойств
 * компонента, но в `colors` указываются {@link ColorToken} (строковые id клиент получает
 * после сериализации, см. {@link Component#resolveRuleOverridesForClient}).
 */
export type ComponentRuleOverrides<PropertiesType extends ComponentProperties> =
  Partial<Omit<PropertiesType, "colors">> & {
    colors?: Partial<Record<ColorRole, ColorToken>>;
  };

/**
 * @prop onShow - обработчики, которые должны выполниться при инициализации компонента на стороне клиента
 * @prop onHide - обработчики, которые должны выполниться при скрытии компонента на стороне клиента
 * @prop onMouseEnter - обработчики, которые должны выполниться при наведении курсора на компонент
 * @prop onMouseLeave - обработчики, которые должны выполниться при уходе курсора с компонента
 * @prop colors - Цветовые схемы для раскраски
 * @prop font - Stack token для сборки CSS-свойств шрифта
 * @prop scale - масштаб компонента
 * @prop textAlign - горизонтальное выравнивание текста компонента и его потомков
 * @prop textDecoration - оформление текста (подчёркивание, зачёркивание)
 * @prop gridItem - настройки размещения элемента, когда он находится внутри grid
 * @prop link - адрес перехода при клике на компонент
 * @prop conditions - условия, при выполнении которых компонент отобразится на клиенте
 * @prop rules - правила, при выполнении conditions значения из overrides переопределяют свойства компонента
 */
export type ComponentInitConfig<
  ComponentType extends Componentable,
  PropertiesType extends ComponentProperties = ComponentProperties,
> = {
  link?: {
    value: string;
  };
  onShow?:
    | ServerComponentAction<ComponentType>
    | ServerComponentAction<ComponentType>[];
  onHide?:
    | ServerComponentAction<ComponentType>
    | ServerComponentAction<ComponentType>[];
  onMouseEnter?:
    | ServerComponentAction<ComponentType>
    | ServerComponentAction<ComponentType>[];
  onMouseLeave?:
    | ServerComponentAction<ComponentType>
    | ServerComponentAction<ComponentType>[];
  colors?: Partial<Record<ColorRole, ColorToken>>;
  font?: FontStackToken;
  scale?: number;
  textAlign?: TextAlign;
  textDecoration?: TextDecoration;
  /** Настройки размещения элемента, когда он находится внутри grid. */
  gridItem?: GridItem;
  conditions?: Condition[] | (() => Condition[]);
  rules?: {
    conditions: [Condition, ...Condition[]];
    overrides: ComponentRuleOverrides<PropertiesType>;
  }[];
};

type DefaultInitConfigType = ComponentInitConfig<
  Component,
  ComponentProperties
>;

/** Список доступных видов обработчиков, нужен чтобы не копировать в каждый компонент */
export type ServerComponentAction<
  ComponentType extends Componentable,
  PayloadType = unknown,
> =
  | ServerAction<ComponentType, PayloadType>
  | ServerActionHandler<ComponentType, PayloadType>
  | LocalAction;

export type ServerDestroyAction<ComponentType extends Componentable> =
  | ServerAction<ComponentType, undefined>
  | ServerActionHandler<ComponentType, undefined>;

type ParsedServerComponentAction<
  ComponentType extends Componentable,
  PayloadType = unknown,
> = ServerAction<ComponentType, PayloadType> | LocalAction;

type ParsedServerDestroyAction<ComponentType extends Componentable> =
  ServerAction<ComponentType, undefined>;

/**
 * @typeParam InitConfigType - Тип конфигурации, используемой в конструкторе компонента
 * @typeParam PropertiesType - Тип свойств компонента
 */
export abstract class Component<
  InitConfigType extends ComponentInitConfig<any, any> = DefaultInitConfigType,
  PropertiesType extends ComponentProperties = ComponentProperties,
> implements Componentable
{
  // Счетчик использований, используется для формирования id использования
  private instancePrefix = 0;
  /** Информаиця об использовании компонента, при каждой сериализации сохраняется для какого клиента и entry она было выполнена */
  protected instances: ComponentInstance<this>[] = [];
  /** Подписки на disconnect/reconnect/destroy по клиентам (снимаются в {@link notifyReleasedFromClient} и при destroy). */
  protected clientSubscriptions = new Map<Client, Subscription>();
  /** Entry, для которых уже подписан destroyInstance$ (до commitSerialization instance.entry ещё пуст). */
  private subscribedEntries = new WeakSet<EntryComponent>();
  /** Идентификатор класса компонента, должен быть уникальным, нужен для поиска компонента в клиентском приложении */
  protected abstract class(): ServerComponentClass;
  /** Уникальный идентификатор компонента */
  readonly id: string;
  /** Свойства компонента, нельзя менять после создания */
  private _properties?: PropertiesType;
  /** Виды взаимодействий (событий) и обработчики. Компонент сам определяет список доступных взаимодействий */
  private interactions = new Map<
    string,
    ParsedServerComponentAction<Componentable, any>[]
  >();
  /** Серверные cleanup-обработчики для окончательного release instance. Не сериализуются на клиент. */
  private destroyHandlers: ParsedServerDestroyAction<Componentable>[] = [];

  private _destroyInstance$ = new Subject<ComponentInstance>();

  /** Сигнал о том, что инстанс компонента прекращено */
  readonly destroyInstance$ = this._destroyInstance$.asObservable();

  private _startUsing$ = new Subject<void>();

  /** Сигнал о том, что инстанс компонента началось (появилось первое инстанс) */
  readonly startUsing$ = this._startUsing$.asObservable();

  private _stopUsing$ = new Subject<void>();

  /** Сигнал о том, что инстанс компонента прекращено (завершилось последнее инстанс) */
  readonly stopUsing$ = this._stopUsing$.asObservable();

  constructor(protected config: InitConfigType) {
    this.id = crypto.randomUUID();
    if (config.onShow) {
      this.bindActions("show", config.onShow);
    }
    if (config.onHide) {
      this.bindActions("hide", config.onHide);
    }
    if (config.onMouseEnter) {
      this.bindActions("mouseenter", config.onMouseEnter);
    }
    if (config.onMouseLeave) {
      this.bindActions("mouseleave", config.onMouseLeave);
    }
  }

  /** Инициализация свойств, происходит при первом обращении к свойствам */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    const colorSources = { ...this.colors(), ...initValues.colors };
    const colors =
      Object.keys(colorSources).length > 0
        ? resolvePartialColorsToIds(colorSources)
        : undefined;
    // @ts-expect-error properties are validated elsewhere; unsafe cast is intentional
    return {
      font: initValues.font,
      scale: initValues.scale,
      textAlign: initValues.textAlign,
      textDecoration: initValues.textDecoration,
      gridItem: initValues.gridItem,
      link: initValues.link,
      colors,
    };
  }

  /** Свойства компонента, изменение запрещено */
  get properties(): Readonly<PropertiesType> {
    if (!this._properties) {
      this._properties = this.initProperties(this.config);
    }
    return this._properties;
  }

  protected colors(): Partial<Record<ColorRole, ColorToken>> {
    return {};
  }

  /** Массовая установка обработчиков на взаимодействие */
  protected bindActions(
    event: string,
    actions:
      | ServerComponentAction<Componentable>
      | ServerComponentAction<Componentable>[],
  ) {
    (Array.isArray(actions) ? actions : [actions]).map((action) => {
      this.onInteraction(event, action);
    });
  }

  /** Массовая установка внутренних server-only cleanup-обработчиков release stage. */
  protected bindDestroyActions(
    actions:
      | ServerDestroyAction<Componentable>
      | ServerDestroyAction<Componentable>[],
  ) {
    (Array.isArray(actions) ? actions : [actions]).forEach((action) => {
      this.destroyHandlers.push(this.parseDestroyAction(action));
    });
  }

  /** Рассылка сообщения всем подписанным клиентам данного компонента */
  protected broadcast(message: ComponentCommandMessage) {
    new Set(
      this.instances
        .map((x) => x.client)
        .filter((client): client is Client => !!client),
    ).forEach((client) => {
      client.outcomingMessage$.next(message);
    });
  }

  /** Обработка взаимодействия  */
  protected emitInteraction(
    type: string,
    payload: unknown,
    instance: ComponentInstance<this>,
  ): void {
    const client = currentClient();
    this.interactions.get(type)?.forEach((handler) => {
      if (handler instanceof ServerAction && handler.canExecute(client)) {
        handler.execute({
          instance,
          payload,
        });
      }
    });
  }

  /** Выполняет server-only cleanup перед окончательным release instance. */
  protected emitOnDestroy(instance: ComponentInstance<this>): void {
    if (this.destroyHandlers.length === 0) {
      return;
    }
    const client = instance.client;
    if (!client) {
      return;
    }
    runWithClient(client, () => {
      this.destroyHandlers.forEach((handler) => {
        if (handler.canExecute(client)) {
          handler.execute({
            instance,
            payload: undefined,
          });
        }
      });
    });
  }

  /** Добавление обработчика на взаимодействие */
  protected onInteraction<PayloadType>(
    type: string,
    callback: ServerComponentAction<Componentable, PayloadType>,
  ): this {
    const value = this.interactions.get(type) || [];
    value.push(this.parseAction(callback));
    this.interactions.set(type, value);
    return this;
  }

  protected usingByClient(client: Client) {
    return this.clientSubscriptions.has(client);
  }

  protected usingByEntry(entry: EntryComponent) {
    return (
      this.subscribedEntries.has(entry) ||
      this.instances.some((x) => x.entry?.component === entry)
    );
  }

  protected serializeRuleOverrides(
    overrides: Record<string, unknown>,
  ): Record<string, unknown> {
    return overrides;
  }

  protected resolveRuleOverridesForClient(
    overrides: ComponentRuleOverrides<PropertiesType>,
  ): Partial<PropertiesType> {
    if (overrides.colors === undefined) {
      return overrides as Partial<PropertiesType>;
    }
    const colors = resolvePartialColorsToIds(overrides.colors);
    return {
      ...overrides,
      colors: Object.keys(colors).length > 0 ? colors : undefined,
    } as Partial<PropertiesType>;
  }

  /** Проверяет, содержит ли компонент хотя бы один серверный обработчик. В этом случае нужно подписываться на входящие сообщения от клиента */
  private hasServerAction() {
    for (const eventInteractions of this.interactions.entries()) {
      if (eventInteractions[1].some((x) => x instanceof ServerAction)) {
        return true;
      }
    }
    return false;
  }

  getInstances(filter?: { client?: Client; entry?: Componentable }) {
    let res = this.instances;
    if (filter) {
      if (filter.client) {
        res = res.filter((x) => x.client === filter.client);
      }
      if (filter.entry) {
        res = res.filter((x) => x.entry?.component === filter.entry);
      }
    }
    return res;
  }

  createInstance() {
    const id = this.currentIdForSerialization();
    this.instancePrefix++;
    const client = currentClient();
    const entry = tryCurrentEntry();
    const entryComponent = entry?.component;
    // Снятие instances при уничтожении entry нужно всем компонентам, не только с server-action.
    const isEntrySerializingItself =
      entryComponent !== undefined &&
      entryComponent === (this as unknown as EntryComponent);
    if (
      entryComponent &&
      !this.usingByEntry(entryComponent) &&
      !isEntrySerializingItself
    ) {
      this.subscribeEntryEvents(entryComponent);
    }
    if (this.hasServerAction() && !this.usingByClient(client)) {
      this.subscribeClientEvents(client);
    }
    const instance = new ComponentInstance(id, this);
    this.instances.push(instance);
    trackCreatedInstance(instance);
    return instance;
  }

  /** Instance entry без подписки на события entry — для корневой serialize EntryComponent. */
  protected createSelfEntry(): ComponentInstance<this> {
    const id = this.currentIdForSerialization();
    this.instancePrefix++;
    const client = currentClient();
    if (this.hasServerAction() && !this.usingByClient(client)) {
      this.subscribeClientEvents(client);
    }
    const instance = new ComponentInstance(id, this);
    this.instances.push(instance);
    trackCreatedInstance(instance);
    return instance;
  }

  protected currentIdForSerialization() {
    return `${this.id}-${this.instancePrefix}`;
  }

  /** Сериализация компонента перед отправкой клиенту. Использование передается в случае когда не нужно создавать новое инстанс компонента */
  serialize(instance?: ComponentInstance<this>) {
    if (instance?.serialized) {
      throw new Error(
        "Instance already serialized. Create new instance instead.",
      );
    }
    if (!instance) {
      instance = this.createInstance();
    }
    if (this.instances.length === 1) {
      this._startUsing$.next();
    }

    const interactions: Record<string, ServerComponentInteraction[]> = {};
    this.interactions.forEach((eventInteractions, key) => {
      interactions[key] = [];
      eventInteractions.forEach((eventInteraction) => {
        interactions[key].push(eventInteraction.toJSON());
      });
    });
    /** Условия, при выполнении которых компонент отобразится на клиенте */
    let conditions: Condition[];
    if (this.config.conditions) {
      conditions = Array.isArray(this.config.conditions)
        ? this.config.conditions
        : this.config.conditions();
    } else {
      conditions = [];
    }

    const properties = this.properties;
    const rules: SerializedComponentRule<Partial<PropertiesType>>[] =
      this.config.rules?.map(({ conditions, overrides }) => ({
        conditions: conditions.map((condition) => condition.toJSON()),
        overrides: this.resolveRuleOverridesForClient(overrides),
      })) ?? [];
    const hasProperties = properties && Object.keys(properties).length > 0;
    const hasInteractions = Object.keys(interactions).length > 0;
    const hasConditions = conditions.length > 0;
    const hasRules = rules.length > 0;

    const result: ServerComponentConfig = {
      id: instance.id,
      class: this.class(),
    };

    if (hasConditions) {
      result.conditions = conditions.map((condition) => condition.toJSON());
    }
    if (hasInteractions) {
      result.interactions = interactions;
    }
    if (hasProperties) {
      result.properties = properties;
    }
    if (hasRules) {
      result.rules = rules.map((rule) => ({
        ...rule,
        overrides: this.serializeRuleOverrides(rule.overrides),
      }));
    }

    instance.commitSerialization();
    return result;
  }
  /** Новый клиент, за которым нужно наблюдать */

  protected subscribeClientEvents(client: Client): void {
    const sub = new Subscription();
    sub.add(
      client.destroy$.subscribe(() => {
        this.teardownClient(client);
      }),
    );
    sub.add(
      client.incomingMessage$
        .pipe(
          filter((message) => message instanceof ComponentInteractionMessage),
          filter((message) => componentBaseId(message.target) === this.id), // Потому что в идентификаторе компонента теперь присутствутет порядковый суффикс
        )
        .subscribe(
          incomingMessageObserver(client, (message) => {
            const instance = this.instances.find(
              (x) => x.id === message.target,
            );
            if (!instance) {
              client.error$.next(
                "Component interaction call, component instance not found",
              );
              return;
            }
            if (instance.client !== client) {
              client.error$.next(
                "Component interaction call, component are not using for this client",
              );
              return;
            }
            this.emitInteraction(message.eventType, message.payload, instance);
          }),
        ),
    );
    this.clientSubscriptions.set(client, sub);
  }

  private subscribeEntryEvents(entry: EntryComponent) {
    this.subscribedEntries.add(entry);
    entry.destroyInstance$.subscribe((releasedEntry) => {
      this.releaseInstances(
        this.instances.filter((x) => x.entry === releasedEntry),
      );
    });
  }

  private parseAction<PayloadType>(
    action: ServerComponentAction<Componentable, PayloadType>,
  ): ParsedServerComponentAction<Componentable, PayloadType> {
    if (action instanceof Action) {
      return action as ParsedServerComponentAction<Componentable, PayloadType>;
    }

    return new ServerAction<Componentable, PayloadType>(action);
  }

  private parseDestroyAction(
    action: ServerDestroyAction<Componentable>,
  ): ParsedServerDestroyAction<Componentable> {
    if (action instanceof ServerAction) {
      return action;
    }
    if (action instanceof Action) {
      throw new Error(
        "onDestroy supports only server actions and does not allow LocalAction",
      );
    }
    return new ServerAction<Componentable, undefined>(action);
  }

  /* @internal */
  releaseInstances(instances: ComponentInstance[]) {
    const activeInstances = instances.filter((instance) =>
      this.instances.includes(instance as ComponentInstance<this>),
    ) as ComponentInstance<this>[];
    if (activeInstances.length === 0) {
      return;
    }
    const hadInstances = this.instances.length > 0;
    activeInstances.forEach((instance) => this.emitOnDestroy(instance));
    this.instances = this.instances.filter((x) => !activeInstances.includes(x));
    activeInstances.forEach((u) => this._destroyInstance$.next(u)); // Сообщение другим, что инстанс компонента прекращено
    if (hadInstances && this.instances.length === 0) {
      this._stopUsing$.next();
    }
  }

  private teardownClient(client: Client): void {
    this.clientSubscriptions.get(client)?.unsubscribe();
    this.clientSubscriptions.delete(client);
    this.releaseInstances(this.instances.filter((x) => x.client === client));
  }
}
