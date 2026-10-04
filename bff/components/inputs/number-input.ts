import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { Componentable, ContextRef, ContextValueRef } from "../../core";
import {
  InputComponent,
  InputInitConfig,
  InputProperties,
} from "./input-component";

export type NumberInputProperties = {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
} & InputProperties;

/** Ссылка контекста со значением `number | undefined` для {@link NumberInput}. */
export type NumberInputContextRef = ContextValueRef<number | undefined>;

/**
 * Конфигурация инициализации компонента ввода числа.
 */
export type NumberInputInitConfig<
  ComponentType extends Componentable = NumberInput,
  RefType extends NumberInputContextRef = NumberInputContextRef,
  PropertiesType extends NumberInputProperties = NumberInputProperties,
> = {
  /**
   * Текст-заполнитель, отображаемый в поле ввода.
   */
  placeholder?: string;

  /**
   * Минимально допустимое значение.
   */
  min?: number;

  /**
   * Максимально допустимое значение.
   */
  max?: number;

  /**
   * Шаг изменения значения.
   */
  step?: number;
} & InputInitConfig<number, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends NumberInputContextRef> =
  NumberInputInitConfig<NumberInput, RefType>;

export function numberInput<RefType extends NumberInputContextRef>(
  options: Omit<DefaultInitConfigType<RefType>, "ref">,
  ref: DefaultInitConfigType<RefType>["ref"],
): NumberInput<RefType>;
export function numberInput<RefType extends NumberInputContextRef>(
  ref: DefaultInitConfigType<RefType>["ref"],
): NumberInput<RefType>;
export function numberInput<RefType extends NumberInputContextRef>(
  config: NumberInputInitConfig<any, RefType>,
): NumberInput<RefType>;
export function numberInput<RefType extends NumberInputContextRef>(
  arg0:
    | DefaultInitConfigType<RefType>["ref"]
    | Omit<DefaultInitConfigType<RefType>, "ref">
    | NumberInputInitConfig<any, RefType>,
  arg1?: DefaultInitConfigType<RefType>["ref"],
): NumberInput<RefType> {
  if (arg1 !== undefined) {
    return new NumberInput<RefType>({
      ...(arg0 as Omit<DefaultInitConfigType<RefType>, "ref">),
      ref: arg1,
    });
  }
  const single = arg0;
  if (single instanceof ContextRef) {
    return new NumberInput<RefType>({ ref: single });
  }
  return new NumberInput<RefType>(
    single as NumberInputInitConfig<any, RefType>,
  );
}

/**
 * Компонент ввода числовых значений.
 *
 * Наследует функциональность от {@link InputComponent}.
 */
export class NumberInput<
  RefType extends NumberInputContextRef = NumberInputContextRef,
  PropertiesType extends NumberInputProperties = NumberInputProperties,
> extends InputComponent<DefaultInitConfigType<RefType>, PropertiesType> {
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.NumberInput;
  }

  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
      placeholder: initValues.placeholder,
      min: initValues.min,
      max: initValues.max,
      step: initValues.step,
    };
  }
}
