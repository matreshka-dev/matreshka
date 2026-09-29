import { ServerComponentClass } from "../enums/server-component-class";
import type { OutputConfig } from "./output-config";

export type DateTimeOutputOptions = {
  timeZone?: string;
  weekday?: "long" | "short" | "narrow";
  era?: "long" | "short" | "narrow";
  year?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
  day?: "numeric" | "2-digit";
  hour?: "numeric" | "2-digit";
  minute?: "numeric" | "2-digit";
  second?: "numeric" | "2-digit";
  timeZoneName?:
    | "long"
    | "short"
    | "shortOffset"
    | "longOffset"
    | "shortGeneric"
    | "longGeneric";
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
};

export type DatetimeOutputConfig = {
  class: ServerComponentClass.Datetime;
  properties: {
    locales: string[];
    options?: DateTimeOutputOptions;
  };
} & OutputConfig<string>;
