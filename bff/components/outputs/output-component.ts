import {
  Componentable,
  ContextRef,
  ContextRefValue,
  ContextValueRef,
  StandaloneComponent,
} from "../../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
} from "../component";

/**
 * Конфигурация инициализации для компонента вывода.
 *
 * @template T Тип значения компонента.
 *
 * @property ref Ссылка на значение в контексте, откуда будет браться значение.
 * @property value Статическое значение.
 */

/** Ref на поле вывода (`ContextValueRef` для скalar `ValueType` компонента). */
export type OutputContextRef<ValueType> = ContextValueRef<
  ValueType | undefined
>;

/** Ref на строковое поле вывода. */
export type StringOutputContextRef = OutputContextRef<string>;

/** Ref на числовое поле вывода. */
export type NumberOutputContextRef = OutputContextRef<number>;

export type CompatibleOutputRef<
  ValueType,
  RefType extends OutputContextRef<ValueType>,
> = ValueType extends ContextRefValue<RefType> ? RefType : never;

export type OutputInitConfig<
  ValueType,
  ComponentType extends Componentable = OutputComponent,
  RefType extends OutputContextRef<ValueType> = OutputContextRef<ValueType>,
  PropertiesType extends OutputProperties = OutputProperties,
> = ({ ref: CompatibleOutputRef<ValueType, RefType> } | { value: ValueType }) &
  ComponentInitConfig<ComponentType, PropertiesType>;

/**
 * Свойства компонента вывода.
 *
 * @property ref Ссылка на значение в контексте.
 */
export type OutputProperties = {
  value?: unknown;
  ref?: string;
} & ComponentProperties;

type DefaultInitConfigType<ValueType> = OutputInitConfig<
  ValueType,
  OutputComponent
>;

/**
 * Абстрактный базовый класс для компонентов вывода.
 *
 * @template InitConfigType Тип конфигурации инициализации компонента.
 * @template PropertiesType Тип свойств компонента.
 *
 * Реализует интерфейс StandaloneComponent.
 */
export abstract class OutputComponent<
    InitConfigType extends OutputInitConfig<
      unknown,
      any
    > = DefaultInitConfigType<unknown>,
    PropertiesType extends OutputProperties = OutputProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent
{
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
   * @param initValues Объект инициализации компонента.
   * @returns Объект свойств компонента.
   */
  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      value:
        "value" in initValues
          ? initValues.value instanceof ContextRef
            ? initValues.value.toString()
            : initValues.value
          : undefined,
      ref: "ref" in initValues ? initValues.ref : undefined,
    };
  }
}

/**
 * Первая аргумент-мост для фабрик output: литерал `value` или экземпляр {@link ContextRef}.
 */
export function outputValueRefToConfig<TOpts extends object>(
  valueOrRef: unknown,
  opts: TOpts,
): TOpts & ({ ref: ContextValueRef<unknown> } | { value: unknown }) {
  if (valueOrRef instanceof ContextRef) {
    return { ...opts, ref: valueOrRef };
  }
  return { ...opts, value: valueOrRef };
}
