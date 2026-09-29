import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { DialogCloseMessage } from "@matreshka/shared/messages/bff-to-client/components/dialog/dialog-close-message";
import { OverlayAnchor } from "@matreshka/shared/types/container-overlay";
import type { DialogBackdropConfig } from "@matreshka/shared/types/dialog-backdrop-config";
import type { DialogConfig } from "@matreshka/shared/types/dialog-config";
import type { ServerComponentInteraction } from "@matreshka/shared/types/server-component-interaction";
import {
  calculateComponents,
  Componentable,
  ComponentInstance,
  ComponentTreeNode,
  MixedWithCallbacksArray,
  serializeComponentList,
  serializeOverlays,
} from "../core";
import type { AnimateComponent } from "../core/actions/animate-component";
import {
  EntryComponent,
  EntryComponentInitConfig,
  EntryComponentProperties,
} from "./entry-component";
import { Overlay } from "./types/container-overlay";

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
  overlays?: Overlay[];
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
  overlays?: Overlay[];
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
 * Абстрактный базовый класс диалогового компонента.
 *
 * @template InitConfigType Тип конфигурации инициализации.
 */
export class Dialog<
    InitConfigType extends DialogInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends DialogProperties = DialogProperties,
  >
  extends EntryComponent<InitConfigType, PropertiesType>
  implements Componentable
{
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
      content: calculateComponents(initValues.content),
      anchors: initValues.anchors,
      modal: initValues.modal,
      overlays: initValues.overlays,
      backdrop: serializeDialogBackdrop(initValues.backdrop),
    };
  }

  /**
   * Закрывает диалог, инициируя событие взаимодействия "close".
   */
  close(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new DialogCloseMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new DialogCloseMessage(this.id));
    }
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
  ): DialogConfig {
    const result = super.serializeEntry(instance);
    const p = this.properties;
    return {
      ...result,
      class: ServerComponentClass.Dialog,
      properties: {
        ...p,
        content: serializeComponentList(p.content),
        overlays: p.overlays ? serializeOverlays(p.overlays) : [],
      },
    };
  }

  override serialize(instance?: ComponentInstance<this>): DialogConfig {
    return this.withEntrySerializationContext(instance, (resolvedInstance) =>
      this.serializeEntry(resolvedInstance),
    );
  }
}
