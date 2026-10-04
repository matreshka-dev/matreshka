import {
  CompatibleContextValueRef,
  Componentable,
  ContextRef,
  StandaloneComponent,
} from "../../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "../component";

/**
 * Конфигурация инициализации компонента ввода.
 * @property ref Ссылка в контексте.
 */
/** @see CompatibleContextValueRef */
export type CompatibleInputRef<
  ValueType,
  RefType extends ContextRef<any, any>,
> = CompatibleContextValueRef<ValueType, RefType>;

export type InputInitConfig<
  ValueType,
  ComponentType extends Componentable = InputComponent,
  RefType extends ContextRef<any, any> = ContextRef<any, any>,
  PropertiesType extends InputProperties = InputProperties,
> = {
  ref: CompatibleInputRef<ValueType, RefType>;
} & ComponentInitConfig<ComponentType, PropertiesType>;

/**
 * Свойства компонента ввода.
 * @property ref Ссылка в контексте.
 */
export type InputProperties = {
  ref: string;
} & ComponentProperties;

type DefaultInitConfigType<ValueType> = InputInitConfig<
  ValueType,
  InputComponent
>;

/**
 * Абстрактный базовый класс компонента ввода.
 *
 * @template InitConfigType Тип конфигурации инициализации.
 */
export abstract class InputComponent<
    InitConfigType extends InputInitConfig<
      unknown,
      any
    > = DefaultInitConfigType<unknown>,
    PropertiesType extends InputProperties = InputProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
  /**
   * Возвращает признак, что компонент является самостоятельным.
   * @returns Всегда true.
   */
  standalone(): true {
    return true;
  }

  /**
   * Инициализирует свойства компонента ввода.
   * @param initValues Конфигурация инициализации.
   * @returns Свойства компонента.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      ref: initValues.ref,
    };
  }
}
