import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { PopoverCloseMessage } from "@matreshka/shared/messages/bff-to-client/components/popover/popover-close-message";
import type { PopoverConfig } from "@matreshka/shared/types/popover-config";
import {
  calculateComponents,
  Componentable,
  ComponentInstance,
  ComponentTreeNode,
  MixedWithCallbacksArray,
  serializeComponentList,
  serializeOverlays,
} from "../core";
import {
  EntryComponent,
  EntryComponentInitConfig,
  EntryComponentProperties,
} from "./entry-component";
import { PopoverPositionArea } from "./enum/popover-position-area";
import { Overlay } from "./types/container-overlay";

export type PopoverProperties = {
  content: ComponentTreeNode[];
  positionArea?: PopoverPositionArea;
  size?: number;
  overlays?: Overlay[];
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
  overlays?: Overlay[];
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
 * Компонент всплывающей панели (popover), содержащей вложенные компоненты.
 *
 * На клиенте рендерится через [Popover API](https://doka.guide/html/popover/) (`popover="auto"`).
 */
export class Popover<
  InitConfigType extends PopoverInitConfig<any> = DefaultInitConfigType,
  PropertiesType extends PopoverProperties = PopoverProperties,
> extends EntryComponent<InitConfigType, PropertiesType> {
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
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new PopoverCloseMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new PopoverCloseMessage(this.id));
    }
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
      content: calculateComponents(initValues.content),
      positionArea: initValues.positionArea,
      size: initValues.size,
      overlays: initValues.overlays,
    };
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
  ): PopoverConfig {
    const result = super.serializeEntry(instance);
    const p = this.properties;
    return {
      ...result,
      class: ServerComponentClass.Popover,
      properties: {
        ...p,
        content: serializeComponentList(p.content),
        overlays: p.overlays ? serializeOverlays(p.overlays) : [],
      },
    };
  }

  override serialize(instance?: ComponentInstance<this>): PopoverConfig {
    return this.withEntrySerializationContext(instance, (resolvedInstance) =>
      this.serializeEntry(resolvedInstance),
    );
  }
}
