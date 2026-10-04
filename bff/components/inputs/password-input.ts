import { PasswordInputKind } from "@matreshka/shared/enums/password-input-kind";
import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { Componentable, ContextRef } from "../../core";
import {
  InputComponent,
  InputInitConfig,
  InputProperties,
  StringInputContextRef,
} from "./input-component";

export type PasswordInputProperties = {
  placeholder?: string;
  kind?: PasswordInputKind;
} & InputProperties;

export type PasswordInputInitConfig<
  ComponentType extends Componentable = PasswordInput,
  RefType extends StringInputContextRef = StringInputContextRef,
  PropertiesType extends PasswordInputProperties = PasswordInputProperties,
> = {
  placeholder?: string;
  kind?: PasswordInputKind;
} & InputInitConfig<string, ComponentType, RefType, PropertiesType>;

type DefaultInitConfigType<RefType extends StringInputContextRef> =
  PasswordInputInitConfig<PasswordInput, RefType>;

export function passwordInput<
  RefType extends StringInputContextRef = StringInputContextRef,
>(
  options: Omit<DefaultInitConfigType<RefType>, "ref">,
  ref: DefaultInitConfigType<RefType>["ref"],
): PasswordInput<RefType>;
export function passwordInput<
  RefType extends StringInputContextRef = StringInputContextRef,
>(ref: DefaultInitConfigType<RefType>["ref"]): PasswordInput<RefType>;
export function passwordInput<
  RefType extends StringInputContextRef = StringInputContextRef,
>(config: PasswordInputInitConfig<any, RefType>): PasswordInput<RefType>;
export function passwordInput<
  RefType extends StringInputContextRef = StringInputContextRef,
>(
  arg0:
    | DefaultInitConfigType<RefType>["ref"]
    | Omit<DefaultInitConfigType<RefType>, "ref">
    | PasswordInputInitConfig<any, RefType>,
  arg1?: DefaultInitConfigType<RefType>["ref"],
): PasswordInput<RefType> {
  if (arg1 !== undefined) {
    return new PasswordInput<RefType>({
      ...(arg0 as Omit<DefaultInitConfigType<RefType>, "ref">),
      ref: arg1,
    });
  }
  const single = arg0;
  if (single instanceof ContextRef) {
    return new PasswordInput<RefType>({ ref: single });
  }
  return new PasswordInput<RefType>(
    single as PasswordInputInitConfig<any, RefType>,
  );
}

/**
 * Компонент ввода пароля.
 *
 * @property kind Семантический вид автозаполнения пароля.
 * Наследует функциональность от {@link InputComponent}.
 */
export class PasswordInput<
  RefType extends StringInputContextRef = StringInputContextRef,
  PropertiesType extends PasswordInputProperties = PasswordInputProperties,
> extends InputComponent<DefaultInitConfigType<RefType>, PropertiesType> {
  constructor(config: DefaultInitConfigType<RefType>) {
    super(config);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.Password;
  }

  protected initProperties(
    initValues: DefaultInitConfigType<RefType>,
  ): PropertiesType {
    return {
      ...super.initProperties(initValues),
      placeholder: initValues.placeholder,
      kind: initValues.kind,
    };
  }
}
