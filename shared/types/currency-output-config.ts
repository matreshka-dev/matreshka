import { ServerComponentClass } from "../enums/server-component-class";
import type { OutputConfig } from "./output-config";

export type CurrencyOutputConfig = {
  class: ServerComponentClass.Currency;
  properties: {
    currency: string;
    minIntegerDigits?: number;
    minFractionDigits?: number;
    maxFractionDigits?: number;
  };
} & OutputConfig<number | undefined>;
