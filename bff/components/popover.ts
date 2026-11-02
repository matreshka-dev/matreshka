import { ServerComponentClass } from "@matreshka/protocol/enums/server-component-class";
import { PopoverCloseMessage } from "@matreshka/protocol/messages/bff-to-client/components/popover/popover-close-message";
import type { PopoverConfig } from "@matreshka/protocol/types/popover-config";
import {
  calculateComponents,
  Componentable,
  ComponentInstance,
  ComponentTreeNode,
  MixedWithCallbacksArray,
} from "../core";
import type { ActionConfig } from "../core/actions/action";
import { closeEntry } from "../core/actions/close-entry";
import {
  EntryComponent,
  EntryComponentInitConfig,
  EntryComponentProperties,
} from "./entry-component";
import { PopoverPositionArea } from "./enum/popover-position-area";

export type PopoverProperties = {
  content: ComponentTreeNode[];
  positionArea?: PopoverPositionArea;
  size?: number;
} & EntryComponentProperties;

/**
 * Конфигурация инициализации для компонента Popover.
 *
 * @property content Список вложенных компонентов.
 * @property positionArea Привязка к якорю через CSS Anchor Positioning (`position-area`).
 *  Если не задано, позиция определяется только поведением Popover API в браузере.
 */
export type PopoverInitConfig<
  ComponentType extends Componentable = Popover,
  PropertiesType extends PopoverProperties = PopoverProperties,
> = {
  content: MixedWithCallbacksArray<ComponentTreeNode>;
  positionArea?: PopoverPositionArea;
  /**
   * Ширина popover: значение > 1 интерпретируется в px, значение от 0 до 1
   * передается клиенту как отношение к ширине якоря.
   */
  size?: number;
} & EntryComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType = PopoverInitConfig<Popover>;
type PopoverContent = DefaultInitConfigType["content"];
type PopoverOptions = Omit<DefaultInitConfigType, "content">;

export function popover(content: PopoverContent): Popover;
export function popover(
  options: PopoverOptions,
  content: PopoverContent,
): Popover;
export function popover(config: DefaultInitConfigType): Popover;
export function popover(
  arg0: PopoverContent | PopoverOptions | DefaultInitConfigType,
  arg1?: PopoverContent,
): Popover {
  if (arg1 !== undefined) {
    return new Popover({
      ...(arg0 as PopoverOptions),
      content: arg1,
    });
  }
  const single = arg0;
  if (
    typeof single === "object" &&
    single !== null &&
    !Array.isArray(single) &&
    "content" in single
  ) {
    return new Popover(single);
  }
  return new Popover({ content: single as PopoverContent });
}

/**
 * Всплывающая панель.
 *
 * На клиенте рендерится через [Popover API](https://doka.guide/html/popover/) (`popover="auto"`).
 *
 * Фабрика {@link popover} и `new Popover(config)` задают панель конфигурацией.
 * Наследник задаёт те же поля методами, как Page, и не обязан передавать их в `super`.
 * Метод по умолчанию возвращает значение из конфигурации конструктора.
 * Переопределение заменяет его; `super.метод()` по-прежнему читает конструктор.
 */
export class Popover<
  InitConfigType extends PopoverInitConfig<any> = DefaultInitConfigType,
  PropertiesType extends PopoverProperties = PopoverProperties,
> extends EntryComponent<InitConfigType, PropertiesType, PopoverConfig> {
  /** Локальные (client-only) действия entry-popover. */
  readonly local = {
    close: (config?: ActionConfig) => closeEntry(this, config),
  };

  constructor(config?: Partial<InitConfigType>) {
    super((config ?? {}) as InitConfigType);
  }

  /**
   * Содержимое popover. По умолчанию — `content` конструктора.
   */
  protected content(): InitConfigType["content"] {
    return this.config.content;
  }

  /**
   * Привязка к якорю. По умолчанию — `positionArea` конструктора.
   */
  protected positionArea(): InitConfigType["positionArea"] {
    return this.config.positionArea;
  }

  /**
   * Ширина popover. По умолчанию — `size` конструктора.
   */
  protected size(): InitConfigType["size"] {
    return this.config.size;
  }

  /**
   * Оверлеи popover. По умолчанию — `overlays` конструктора.
   */
  protected overlays(): InitConfigType["overlays"] {
    return this.config.overlays;
  }

  /**
   * Возвращает уникальный идентификатор класса компонента.
   *
   * @returns Строка "popover".
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Popover;
  }

  /**
   * Закрывает всплывающее окно, инициируя действие "close".
   */
  close(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) => new PopoverCloseMessage(target, { actionScope }),
    );
  }

  /**
   * Инициализирует свойства компонента.
   *
   * @param initValues Объект конфигурации инициализации.
   * @returns Объект со свойствами компонента.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      content: calculateComponents(this.content()),
      positionArea: this.positionArea(),
      size: this.size(),
      overlays: this.overlays(),
    };
  }
}
