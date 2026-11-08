import { ServerComponentClass } from "@matreshka/client-bff-protocol/enums/server-component-class";
import type { ComponentScrollPayload } from "@matreshka/client-bff-protocol/messages/client-to-bff/components/component-scroll-message";
import type { PageConfig } from "@matreshka/client-bff-protocol/types/page-config";
import {
  Componentable,
  ComponentTreeNode,
  MixedWithCallbacksArray,
  Pageable,
} from "../core";
import StatusCode from "../core/types/status-code";
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
  extends EntryComponent<InitConfigType, PropertiesType, PageConfig>
  implements Pageable
{
  constructor() {
    // @ts-expect-error Page задаёт content в boot(), а не через конфиг конструктора Component.
    super({});
  }

  /** Добавляет `scroll` к стандартным enter/leave (см. {@link EntryComponent.entryInteractions}). */
  protected override entryInteractions(): ReturnType<
    EntryComponent["entryInteractions"]
  > {
    return { ...super.entryInteractions(), scroll: this.onScroll() };
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
}
