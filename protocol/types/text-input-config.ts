import { ServerComponentClass } from "../enums/server-component-class";
import { TextInputKind } from "../enums/text-input-kind";
import type { InputConfig } from "./input-config";

type InputMaskProperties = {
  value: string;
  dataSymbols: string;
  accept?: string;
  size?: number;
};

export type TextInputConfig = {
  class: ServerComponentClass.TextInput;
  properties: {
    placeholder?: string;
    mask?: InputMaskProperties;
    kind?: TextInputKind;
  };
} & InputConfig;
