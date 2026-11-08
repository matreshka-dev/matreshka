import {
  AnySchemaContextRef,
  Componentable,
  StandaloneComponent,
  WritableContextRefOfValue,
} from "../../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "../component";

/** Ref на поле ввода: значение `ValueType | undefined`. */
export type InputContextRef<ValueType> = WritableContextRefOfValue<
  ValueType | undefined
>;

/** Ref на строковое поле ввода. */
export type StringInputContextRef = InputContextRef<string>;

/**
 * Конфигурация инициализации компонента ввода.
 * @property ref Ссылка в контексте.
 */
/** Writable ref на поле ввода со значением `ValueType | undefined`. */
export type CompatibleInputRef<
  ValueType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RefType extends AnySchemaContextRef = AnySchemaContextRef,
> = WritableContextRefOfValue<ValueType | undefined>;

export type InputInitConfig<
  ValueType,
  ComponentType extends Componentable = InputComponent,
  RefType extends AnySchemaContextRef = AnySchemaContextRef,
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
