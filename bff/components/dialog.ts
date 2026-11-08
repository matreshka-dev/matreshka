import { ServerComponentClass } from "@matreshka/client-bff-protocol/enums/server-component-class";
import { DialogCloseMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/components/dialog/dialog-close-message";
import { OverlayAnchor } from "@matreshka/client-bff-protocol/types/container-overlay";
import type { DialogBackdropConfig } from "@matreshka/client-bff-protocol/types/dialog-backdrop-config";
import type { DialogConfig } from "@matreshka/client-bff-protocol/types/dialog-config";
import type { ServerComponentInteraction } from "@matreshka/client-bff-protocol/types/server-component-interaction";
import {
  calculateComponents,
  Componentable,
  ComponentInstance,
  ComponentTreeNode,
  MixedWithCallbacksArray,
} from "../core";
import type { ActionConfig } from "../core/actions/action";
import type { AnimateComponent } from "../core/actions/animate-component";
import { closeEntry } from "../core/actions/close-entry";
import {
  EntryComponent,
  EntryComponentInitConfig,
  EntryComponentProperties,
} from "./entry-component";

function serializeLocalActions(
  actions: AnimateComponent | AnimateComponent[] | undefined,
): ServerComponentInteraction[] | undefined {
  if (!actions) {
    return undefined;
  }
  const list = Array.isArray(actions) ? actions : [actions];
  if (list.length === 0) {
    return undefined;
  }
  return list.map((action) => action.toJSON());
}

function serializeDialogBackdrop(
  backdrop: DialogBackdropInitConfig | undefined,
): DialogBackdropConfig | undefined {
  if (!backdrop) {
    return undefined;
  }
  const onEnter = serializeLocalActions(backdrop.onEnter);
  const onLeave = serializeLocalActions(backdrop.onLeave);
  if (!onEnter && !onLeave) {
    return undefined;
  }
  return {
    ...(onEnter ? { onEnter } : {}),
    ...(onLeave ? { onLeave } : {}),
  };
}

/** Анимации подложки модального диалога при инициализации. */
export type DialogBackdropInitConfig = {
  onEnter?: AnimateComponent | AnimateComponent[];
  onLeave?: AnimateComponent | AnimateComponent[];
};

/**
 * Свойства диалога.
 */
export type DialogProperties = {
  content: ComponentTreeNode[];
  /**
   * Якоря позиционирования диалога на экране.
   */
  anchors?: [OverlayAnchor, ...OverlayAnchor[]];
  /**
   * См. {@link DialogInitConfig.modal}.
   */
  modal?: boolean;
  /** Анимации нативной подложки (`::backdrop`) модального диалога. */
  backdrop?: DialogBackdropConfig;
} & EntryComponentProperties;

/**
 * Конфигурация инициализации диалога.
 */
export type DialogInitConfig<
  ComponentType extends Componentable = Dialog,
  PropertiesType extends DialogProperties = DialogProperties,
> = {
  content: MixedWithCallbacksArray<ComponentTreeNode>;
  /**
   * Якоря позиционирования диалога на экране.
   * По умолчанию: Center + Middle.
   */
  anchors?: [OverlayAnchor, ...OverlayAnchor[]];
  /**
   * Режим показа, по смыслу как у [`HTMLDialogElement`](https://doka.guide/html/dialog/):
   * не задано или `true` — модальное окно (`showModal()`): подложка, блокировка прокрутки страницы, `aria-modal="true"`;
   * `false` — немодальное (`show()`): остальная страница остаётся доступной
   */
  modal?: boolean;
  /** Анимации нативной подложки (`::backdrop`) модального диалога. */
  backdrop?: DialogBackdropInitConfig;
} & EntryComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType = DialogInitConfig<Dialog>;
type DialogContent = DefaultInitConfigType["content"];
type DialogOptions = Omit<DefaultInitConfigType, "content">;

export function dialog(content: DialogContent): Dialog;
export function dialog(options: DialogOptions, content: DialogContent): Dialog;
export function dialog(config: DefaultInitConfigType): Dialog;
export function dialog(
  arg0: DialogContent | DialogOptions | DefaultInitConfigType,
  arg1?: DialogContent,
): Dialog {
  if (arg1 !== undefined) {
    return new Dialog({
      ...(arg0 as DialogOptions),
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
    return new Dialog(single);
  }
  return new Dialog({ content: single as DialogContent });
}

/**
 * Базовый класс диалога.
 *
 * Фабрика {@link dialog} и `new Dialog(config)` задают диалог конфигурацией.
 * Наследник задаёт те же поля методами, как Page, и не обязан передавать их в `super`.
 * Метод по умолчанию возвращает значение из конфигурации конструктора.
 * Переопределение заменяет его; `super.метод()` по-прежнему читает конструктор.
 *
 * @template InitConfigType Тип конфигурации инициализации.
 */
export class Dialog<
    InitConfigType extends DialogInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends DialogProperties = DialogProperties,
  >
  extends EntryComponent<InitConfigType, PropertiesType, DialogConfig>
  implements Componentable
{
  /** Локальные (client-only) действия entry-диалога. */
  readonly local = {
    close: (config?: ActionConfig) => closeEntry(this, config),
  };

  constructor(config?: Partial<InitConfigType>) {
    super((config ?? {}) as InitConfigType);
  }

  /**
   * Содержимое диалога. По умолчанию — `content` конструктора.
   */
  protected content(): InitConfigType["content"] {
    return this.config.content;
  }

  /**
   * Якоря позиционирования. По умолчанию — `anchors` конструктора.
   * Обычный массив, чтобы литерал `[OverlayAnchor.Center]` в наследнике не требовал кортеж.
   */
  protected anchors(): readonly OverlayAnchor[] | undefined {
    return this.config.anchors;
  }

  /**
   * Модальность. По умолчанию — `modal` конструктора.
   */
  protected modal(): InitConfigType["modal"] {
    return this.config.modal;
  }

  /**
   * Анимации подложки. По умолчанию — `backdrop` конструктора.
   */
  protected backdrop(): InitConfigType["backdrop"] {
    return this.config.backdrop;
  }

  /**
   * Оверлеи диалога. По умолчанию — `overlays` конструктора.
   */
  protected overlays(): InitConfigType["overlays"] {
    return this.config.overlays;
  }

  /**
   * Возвращает уникальный идентификатор класса компонента.
   * @returns Строка "dialog".
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Dialog;
  }

  /**
   * Инициализирует свойства диалога.
   *
   * @param initValues Конфигурация инициализации.
   * @returns Объект свойств.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      content: calculateComponents(this.content()),
      anchors: this.anchors(),
      modal: this.modal(),
      backdrop: serializeDialogBackdrop(this.backdrop()),
      overlays: this.overlays(),
    };
  }

  /**
   * Закрывает диалог, инициируя событие взаимодействия "close".
   */
  close(instances?: ComponentInstance[]) {
    return this.dispatchComponentCommand(
      instances,
      (target, actionScope) => new DialogCloseMessage(target, { actionScope }),
    );
  }
}
