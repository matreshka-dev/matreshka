import { FlexWrap } from "@matreshka/shared/enums/flex-wrap";
import { ComponentOutline } from "@matreshka/shared/enums/outline-type";
import { Overflow } from "@matreshka/shared/enums/overflow";
import { SafeAreaSide } from "@matreshka/shared/enums/safe-area-side";
import { ScrollToPosition } from "@matreshka/shared/enums/scroll-to-position";
import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import {
  StackCrossAxisAlign,
  StackMainAxisAlign,
} from "@matreshka/shared/enums/stack-align";
import { StackDirection } from "@matreshka/shared/enums/stack-direction";
import { ComponentScrollToMessage } from "@matreshka/shared/messages/bff-to-client/components/component-scroll-to-message";
import type { ComponentScrollPayload } from "@matreshka/shared/messages/client-to-bff/components/component-scroll-message";
import {
  normalizeFlexItem,
  type FlexItemSpec,
} from "@matreshka/shared/types/flex-item";
import type { PaddingPx } from "@matreshka/shared/types/padding-px";
import type { RadiusPx } from "@matreshka/shared/types/radius-px";
import type { StackConfig } from "@matreshka/shared/types/stack-config";
import type { StackScroll } from "@matreshka/shared/types/stack-scroll";
import {
  calculateComponents,
  Componentable,
  ComponentInstance,
  ComponentTreeNode,
  MixedWithCallbacksArray,
  serializeComponentList,
  StandaloneComponent,
} from "../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
  ServerComponentAction,
} from "./component";

export { DimensionalUnit } from "@matreshka/shared/enums/dimensional-unit";
export { FlexWrap } from "@matreshka/shared/enums/flex-wrap";
export { Overflow } from "@matreshka/shared/enums/overflow";
export { SafeAreaSide } from "@matreshka/shared/enums/safe-area-side";
export { ScrollToPosition } from "@matreshka/shared/enums/scroll-to-position";
export {
  StackCrossAxisAlign,
  StackMainAxisAlign,
} from "@matreshka/shared/enums/stack-align";
export { StackDirection } from "@matreshka/shared/enums/stack-direction";
export type { ComponentScrollPayload } from "@matreshka/shared/messages/client-to-bff/components/component-scroll-message";
export type { DimensionalValue } from "@matreshka/shared/types/dimensional-value";
export type { FlexItemSpec } from "@matreshka/shared/types/flex-item";
export type { StackScroll } from "@matreshka/shared/types/stack-scroll";

export type StackProperties = {
  content: ComponentTreeNode[];
  align?: {
    main?: StackMainAxisAlign;
    cross?: StackCrossAxisAlign;
  };
  direction?: StackDirection;
  gap?: number;
  /**
   * Поведение при переполнении содержимого (CSS `overflow`).
   * Если не задано, клиент по умолчанию использует `auto`.
   */
  overflow?: Overflow;
  /**
   * Перенос flex-элементов на новые строки (CSS `flex-wrap`).
   */
  wrap?: FlexWrap;
  /**
   * Поведение flex-item внутри родительского stack: `{ grow }`, `{ basis }`
   * (число > 1 — логические px) или явные `basis` / `grow` / `shrink`.
   */
  flexItem?: FlexItemSpec;
  /**
   * Скругление углов в логических пикселях; на клиенте — в rem.
   */
  radius?: RadiusPx;
  padding?: PaddingPx;
  /**
   * Параметры прокрутки: `padding` → CSS `scroll-padding` на клиенте.
   */
  scroll?: StackScroll;
  safeArea?: SafeAreaSide[];
  surface?: boolean;
  outline?: ComponentOutline[];
  focusWithinStyle?: boolean;
  /**
   * Если true — как у неактивной HTML-кнопки: без активации по клику/клавиатуре и без фокуса с таба.
   * Если не передано — на клиенте обрабатывается как неотключённый контейнер.
   */
  disabled?: boolean;
} & ComponentProperties;

/**
 * Конфигурация инициализации для компонента Stack.
 *
 * @property align Выравнивание содержимого по главной и поперечной осям.
 * @property overflow Поведение при переполнении содержимого (CSS `overflow`: `visible`, `hidden`, `clip`, `scroll`, `auto`). Если не задано, клиент по умолчанию использует `auto`.
 * @property wrap Перенос flex-элементов на новые строки (CSS `flex-wrap`: `nowrap`, `wrap`, `wrap-reverse`, `balance` и комбинации с `balance`).
 * @property gap Промежуток между элементами.
 * @property flexItem Поведение flex-item внутри родителя-stack: `{ grow }`, `{ basis }` (число > 1 — `{ value, unit: px }`) или явные поля.
 * @property content Список вложенных компонентов.
 * @property radius Скругление углов (логические px).
 * @property padding Внутренние отступы (логические px).
 * @property scroll Прокрутка: `padding` — scroll-padding (логические px, схема как у `padding`).
 * @property safeArea Стороны, для которых клиент добавляет системный safe area к padding.
 * @property onClick Обработчики клика по контейнеру.
 * @property onKeyDown Обработчики нажатия клавиши, когда фокус находится на элементе.
 * @property onScroll Обработчики прокрутки по главной оси (`offset`, `viewportSize`, `contentSize`), с троттлингом на клиенте.
 * @property overlays Наложения поверх контейнера.
 * @property surface Фон контейнера (`--background-color`).
 * @property outline Стиль внешней границы контейнера.
 * @property focusWithinStyle Использовать focus-цвета палитры, когда фокус находится на потомках.
 * @property disabled Неинтерактивное состояние (как у HTML button disabled). Без поля — значение по умолчанию задаётся на клиенте.
 */
export type StackInitConfig<
  ComponentType extends Componentable = Stack,
  PropertiesType extends StackProperties = StackProperties,
> = {
  onClick?:
    | ServerComponentAction<ComponentType>
    | ServerComponentAction<ComponentType>[];
  onKeyDown?:
    | ServerComponentAction<ComponentType, { key: string }>
    | ServerComponentAction<ComponentType, { key: string }>[];
  onScroll?:
    | ServerComponentAction<ComponentType, ComponentScrollPayload>
    | ServerComponentAction<ComponentType, ComponentScrollPayload>[];
  align?: {
    main?: StackMainAxisAlign;
    cross?: StackCrossAxisAlign;
  };
  direction?: StackDirection;
  gap?: number;
  /**
   * Поведение при переполнении содержимого (CSS `overflow`).
   * Если не задано, клиент по умолчанию использует `auto`.
   */
  overflow?: Overflow;
  /**
   * Перенос flex-элементов на новые строки (CSS `flex-wrap`).
   */
  wrap?: FlexWrap;
  /**
   * Поведение flex-item внутри родительского stack: `{ grow }`, `{ basis }`
   * (число > 1 — логические px) или явные `basis` / `grow` / `shrink`.
   */
  flexItem?: FlexItemSpec;
  radius?: RadiusPx;
  content: MixedWithCallbacksArray<ComponentTreeNode>;
  padding?: PaddingPx;
  scroll?: StackScroll;
  safeArea?: SafeAreaSide[];
  surface?: boolean;
  outline?: ComponentOutline[];
  focusWithinStyle?: boolean;
  disabled?: boolean;
} & ComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType = StackInitConfig<Stack>;
type StackContent = DefaultInitConfigType["content"];
type StackOptions = Omit<DefaultInitConfigType, "content">;

export function stack(content: StackContent): Stack;
export function stack(options: StackOptions, content: StackContent): Stack;
export function stack(config: DefaultInitConfigType): Stack;
export function stack(
  arg0: StackContent | StackOptions | DefaultInitConfigType,
  arg1?: StackContent,
): Stack {
  if (arg1 !== undefined) {
    return new Stack({
      ...(arg0 as StackOptions),
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
    return new Stack(single);
  }
  return new Stack({ content: single as StackContent });
}

/**
 * Компонент Stack, отображающий вложенные элементы в колонку или строку (`direction`) с возможностью настройки выравнивания, отступов и прокрутки.
 */
export class Stack<
    InitConfigType extends StackInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends StackProperties = StackProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  constructor(config: InitConfigType) {
    super(config);
    if (config.onClick) {
      this.bindActions("click", config.onClick);
    }
    if (config.onKeyDown) {
      this.bindActions(
        "keydown",
        config.onKeyDown as
          | ServerComponentAction<Componentable, unknown>
          | ServerComponentAction<Componentable, unknown>[],
      );
    }
    if (config.onScroll) {
      this.bindActions(
        "scroll",
        config.onScroll as
          | ServerComponentAction<Componentable, unknown>
          | ServerComponentAction<Componentable, unknown>[],
      );
    }
  }

  /**
   * Возвращает флаг, указывающий, что компонент является самостоятельным.
   * @returns Всегда true.
   */
  standalone(): true {
    return true;
  }

  /**
   * Инициализирует свойства компонента на основе конфигурации.
   *
   * @param initValues Конфигурация инициализации.
   * @returns Объект с инициализированными свойствами.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      direction: initValues.direction,
      align: initValues.align,
      gap: initValues.gap,
      overflow: initValues.overflow,
      wrap: initValues.wrap,
      flexItem: normalizeFlexItem(initValues.flexItem),
      radius: initValues.radius,
      content: calculateComponents(initValues.content),
      padding: initValues.padding,
      scroll: initValues.scroll,
      safeArea: initValues.safeArea,
      surface: initValues.surface,
      outline: initValues.outline,
      focusWithinStyle: initValues.focusWithinStyle,
      disabled: initValues.disabled,
    };
  }

  /**
   * Возвращает уникальный идентификатор класса компонента.
   * @returns Строка `"stack"`.
   */
  protected class(): ServerComponentClass {
    return ServerComponentClass.Stack;
  }

  /**
   * Отправляет на клиент команду прокрутки контейнера до указанного значения.
   *
   * По направлению контейнера: при `direction: vertical` — `scrollTop`, при `horizontal` — `scrollLeft`.
   *
   * - {@link ScrollToPosition.Start} или другое неотрицательное `value` — от начала;
   * - {@link ScrollToPosition.End} — в конец;
   * - иное отрицательное `value` — отступ от конца (например `-16`).
   */
  scrollTo(
    value: number | ScrollToPosition,
    smooth: boolean = false,
    instances?: ComponentInstance[],
  ) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new ComponentScrollToMessage(instance.id, {
              value,
              smooth,
            }),
          );
        });
    } else {
      this.broadcast(
        new ComponentScrollToMessage(this.id, {
          value,
          smooth,
        }),
      );
    }
    return this;
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType>,
  ): Record<string, unknown> {
    const out = super.serializeRuleOverrides(overrides);
    if (overrides.content !== undefined) {
      out.content = serializeComponentList(overrides.content);
    }
    if (overrides.flexItem !== undefined) {
      out.flexItem = normalizeFlexItem(overrides.flexItem);
    }
    return out;
  }

  serialize(instance?: ComponentInstance<this>): StackConfig {
    const result = super.serialize(instance);
    return {
      ...result,
      class: ServerComponentClass.Stack,
      properties: this.buildPropertiesForClient({
        content: serializeComponentList(this.properties.content),
      }),
    };
  }
}
