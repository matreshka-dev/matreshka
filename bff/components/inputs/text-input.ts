import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { TextInputKind } from "@matreshka/shared/enums/text-input-kind";
import { Componentable, ContextRef } from "../../core";
import {
  InputComponent,
  InputInitConfig,
  InputProperties,
  StringInputContextRef,
} from "./input-component";

/**
 * Свойства маски ввода текста.
 *
 * @property value Маска ввода, например: '9999-9999-9999-9999'
 * @property dataSymbols Символы для замены в маске, например: '9'
 * @property accept Регулярное выражение для проверки допустимых символов
 * @property size Максильное количество символов
 */
export type InputMaskProperties = {
  value: string;
  dataSymbols: string;
  accept?: string;
  size?: number;
};

export type TextInputProperties = {
  placeholder?: string;
  mask?: InputMaskProperties;
  kind?: TextInputKind;
} & InputProperties;

/**
 * Конфигурация инициализации поля ввода текста.
 * @property placeholder Текст-заполнитель.
 * @property kind Семантический вид текстового поля, который клиент
 * преобразует в `autocomplete` и `inputmode`.
 * @property mask Маска ввода с настройками форматирования.
 */
export type TextInputInitConfig<
  ComponentType extends Componentable = TextInput,
  RefType extends StringInputContextRef = StringInputContextRef,
  PropertiesType extends TextInputProperties = TextInputProperties,
> = {
  placeholder?: string;
  kind?: TextInputKind;
  mask?: InputMaskProperties;
} & InputInitConfig<string, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends StringInputContextRef> =
  TextInputInitConfig<TextInput, RefType>;

export function textInput<
  RefType extends StringInputContextRef = StringInputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "ref">,
  ref: DefaultInitConfigType<RefType>["ref"],
): TextInput<RefType>;
export function textInput<
  RefType extends StringInputContextRef = StringInputContextRef,
>(ref: DefaultInitConfigType<RefType>["ref"]): TextInput<RefType>;
export function textInput<
  RefType extends StringInputContextRef = StringInputContextRef,
>(config: TextInputInitConfig<any, RefType>): TextInput<RefType>;
export function textInput<
  RefType extends StringInputContextRef = StringInputContextRef,
>(
  arg0:
    | DefaultInitConfigType<RefType>["ref"]
    | Omit<DefaultInitConfigType<RefType>, "ref">
    | TextInputInitConfig<any, RefType>,
  arg1?: DefaultInitConfigType<RefType>["ref"],
): TextInput<RefType> {
  if (arg1 !== undefined) {
    return new TextInput<RefType>({
      ...(arg0 as Omit<DefaultInitConfigType<RefType>, "ref">),
      ref: arg1,
    });
  }
  const single = arg0;
  if (single instanceof ContextRef) {
    return new TextInput<RefType>({ ref: single });
  }
  return new TextInput<RefType>(single as TextInputInitConfig<any, RefType>);
}

/**
 * Компонент ввода текста.
 */
export class TextInput<
  RefType extends StringInputContextRef = StringInputContextRef,
  InitConfigType extends TextInputInitConfig<
    any,
    RefType
  > = DefaultInitConfigType<RefType>,
  PropertiesType extends TextInputProperties = TextInputProperties,
> extends InputComponent<InitConfigType, PropertiesType> {
  constructor(config: TextInputInitConfig<any, RefType>);
  constructor(config: InitConfigType) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.TextInput;
  }

  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      placeholder: initValues.placeholder,
      mask: initValues.mask,
      kind: initValues.kind,
    };
  }
}
