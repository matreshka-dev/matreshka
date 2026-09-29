import { ServerComponentClass } from "../enums/server-component-class";
import type { InputConfig } from "./input-config";

export type NumberInputConfig = {
  class: ServerComponentClass.NumberInput;
  properties: {
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
  };
} & InputConfig;
