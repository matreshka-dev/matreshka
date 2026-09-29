import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import type { ComponentScrollPayload } from "@matreshka/shared/messages/client-to-bff/components/component-scroll-message";
import type { PageConfig } from "@matreshka/shared/types/page-config";
import {
  Componentable,
  ComponentInstance,
  ComponentTreeNode,
  MixedWithCallbacksArray,
  Pageable,
} from "../core";
import StatusCode from "../core/types/status-code";
import {
  serializeComponentList,
  serializeOverlays,
} from "../core/utils/serialize-component-tree";
import { ServerComponentAction } from "./component";
import {
  EntryComponent,
  EntryComponentInitConfig,
  EntryComponentProperties,
} from "./entry-component";
import { Overlay } from "./types/container-overlay";

/**
 * Свойства страницы.
 *
 * @property content Массив компонент, составляющих содержимое страницы.
 * @property title Заголовок страницы, отображаемый в интерфейсе пользователя.
 * @property statusCode HTTP-статус код страницы.
 */
export type PageProperties = {
  content: ComponentTreeNode[];
  title: string;
  overlays?: Overlay[];
  statusCode: StatusCode;
} & EntryComponentProperties;

/**
 * Конфигурация инициализации страницы.
 */
export type PageInitConfig<
  ComponentType extends Componentable = Page,
  PropertiesType extends PageProperties = PageProperties,
> = EntryComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType = PageInitConfig<Page>;

/**
 * Абстрактный базовый класс страницы.
 */
export abstract class Page<
    InitConfigType extends PageInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends PageProperties = PageProperties,
  >
  extends EntryComponent<InitConfigType, PropertiesType>
  implements Pageable
{
  constructor() {
    // @ts-expect-error Page задаёт content в boot(), а не через конфиг конструктора Component.
    super({});
    this.bindPageInteraction("scroll", this.onScroll());
    this.bindPageEntryInteraction("enter", this.onEnter());
    this.bindPageEntryInteraction("leave", this.onLeave());
  }

  /** Привязка обработчиков страницы к имени взаимодействия (как на клиенте в `interact`). */
  private bindPageInteraction(
    event: string,
    handlers:
      | ServerComponentAction<Page, any>
      | ServerComponentAction<Page, any>[]
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

  /** Привязка lifecycle entry-страницы к имени взаимодействия. */
  private bindPageEntryInteraction(
    event: string,
    handlers:
      | ServerComponentAction<Page, undefined>
      | ServerComponentAction<Page, undefined>[]
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
   * Возвращает HTTP-статус страницы.
   * @returns Статус страницы (по умолчанию 200 OK).
   */
  statusCode(): StatusCode {
    return StatusCode.OK;
  }

  /**
   * Загружает значения контекста страницы и инициализирует компоненты содержимого.
   */
  async boot(): Promise<unknown> {
    return;
  }

  /**
   * Заголовок страницы, отображаемый во вкладке браузера или в интерфейсе.
   *
   * Должен быть реализован в подклассе.
   */
  protected abstract title(): string;

  /**
   * Компоненты, формирующие содержимое страницы.
   *
   * Должен быть реализован в подклассе.
   *
   * @returns Массив самостоятельных компонентов.
   */
  protected abstract content(): MixedWithCallbacksArray<ComponentTreeNode>;

  /**
   * Оверлеи страницы (рендерятся поверх содержимого страницы).
   *
   * По умолчанию оверлеи отсутствуют. Переопредели в наследнике, чтобы добавить
   * overlay-элементы с якорями позиционирования.
   */

  protected overlays(): Overlay[] {
    return [];
  }

  /**
   * Обработчики прокрутки корня страницы (хост `app-page`), с троттлингом на клиенте.
   * Переопредели в наследнике для дозагрузки списков и т.п.
   */
  protected onScroll():
    | ServerComponentAction<Page, ComponentScrollPayload>
    | ServerComponentAction<Page, ComponentScrollPayload>[]
    | undefined {
    return undefined;
  }

  /**
   * Обработчики показа хоста страницы (`app-page`), после готовности представления на клиенте.
   */
  protected onEnter():
    | ServerComponentAction<Page, undefined>
    | ServerComponentAction<Page, undefined>[]
    | undefined {
    return undefined;
  }

  /**
   * Обработчики скрытия / уничтожения хоста страницы на клиенте.
   */
  protected onLeave():
    | ServerComponentAction<Page, undefined>
    | ServerComponentAction<Page, undefined>[]
    | undefined {
    return undefined;
  }

  /**
   * Инициализирует свойства страницы.
   *
   * @param initValues Конфигурация страницы.
   * @returns Объект свойств страницы.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      statusCode: this.statusCode(),
      title: this.title(),
      content: this.content(),
      overlays: this.overlays(),
    };
  }

  /**
   * Возвращает уникальный идентификатор класса компонента.
   *
   * @returns Строка "page".
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Page;
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType>,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = { ...overrides };
    if (overrides.content !== undefined) {
      out.content = serializeComponentList(overrides.content);
    }
    if (overrides.overlays !== undefined) {
      out.overlays = serializeOverlays(overrides.overlays);
    }
    return out;
  }

  protected override serializeEntry(
    instance: ComponentInstance<this>,
  ): PageConfig {
    const result = super.serializeEntry(instance);
    const p = this.properties;
    return {
      ...result,
      class: ServerComponentClass.Page,
      properties: {
        ...p,
        content: serializeComponentList(p.content),
        overlays: p.overlays ? serializeOverlays(p.overlays) : [],
      },
    };
  }

  override serialize(instance?: ComponentInstance<this>): PageConfig {
    return this.withEntrySerializationContext(instance, (resolvedInstance) =>
      this.serializeEntry(resolvedInstance),
    );
  }
}
