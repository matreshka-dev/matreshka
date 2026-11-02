import { PasswordInputKind } from "../enums/password-input-kind";
import { ServerComponentClass } from "../enums/server-component-class";
import type { InputConfig } from "./input-config";

export type PasswordInputConfig = {
  class: ServerComponentClass.Password;
  properties: {
    placeholder?: string;
    kind?: PasswordInputKind;
  };
} & InputConfig;
