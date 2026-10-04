import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { TextareaResize } from "@matreshka/shared/enums/textarea-resize";
import { Componentable, ContextRef } from "../../core";
import {
  InputComponent,
  InputInitConfig,
  InputProperties,
  StringInputContextRef,
} from "./input-component";

export type TextareaProperties = {
  placeholder?: string;
  rows?: number;
  resize?: TextareaResize;
} & InputProperties;

/**
 * Конфигурация инициализации компонента textarea.
 *
 * @property placeholder Текст-заполнитель, отображаемый в пустом поле.
 * @property rows Количество видимых строк textarea.
 * @property resize Режим изменения размера textarea.
 */
export type TextareaInitConfig<
  ComponentType extends Componentable = Textarea,
  RefType extends StringInputContextRef = StringInputContextRef,
  PropertiesType extends TextareaProperties = TextareaProperties,
> = {
  placeholder?: string;
  rows?: number;
  resize?: TextareaResize;
} & InputInitConfig<string, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends StringInputContextRef> =
  TextareaInitConfig<Textarea, RefType>;

export function textarea<
  RefType extends StringInputContextRef = StringInputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "ref">,
  ref: DefaultInitConfigType<RefType>["ref"],
): Textarea<RefType>;
export function textarea<
  RefType extends StringInputContextRef = StringInputContextRef,
>(ref: DefaultInitConfigType<RefType>["ref"]): Textarea<RefType>;
export function textarea<
  RefType extends StringInputContextRef = StringInputContextRef,
>(config: TextareaInitConfig<any, RefType>): Textarea<RefType>;
export function textarea<
  RefType extends StringInputContextRef = StringInputContextRef,
>(
  arg0:
    | DefaultInitConfigType<RefType>["ref"]
    | Omit<DefaultInitConfigType<RefType>, "ref">
    | TextareaInitConfig<any, RefType>,
  arg1?: DefaultInitConfigType<RefType>["ref"],
): Textarea<RefType> {
  if (arg1 !== undefined) {
    return new Textarea<RefType>({
      ...(arg0 as Omit<DefaultInitConfigType<RefType>, "ref">),
      ref: arg1,
    });
  }
  const single = arg0;
  if (single instanceof ContextRef) {
    return new Textarea<RefType>({ ref: single });
  }
  return new Textarea<RefType>(single as TextareaInitConfig<any, RefType>);
}

/**
 * Компонент многострочного текстового ввода (textarea).
 *
 * Наследует поведение от {@link InputComponent}.
 */
export class Textarea<
  RefType extends StringInputContextRef = StringInputContextRef,
  PropertiesType extends TextareaProperties = TextareaProperties,
> extends InputComponent<DefaultInitConfigType<RefType>, PropertiesType> {
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.Textarea;
  }

  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
      placeholder: initValues.placeholder,
      rows: initValues.rows,
      resize: initValues.resize,
    };
  }
}
