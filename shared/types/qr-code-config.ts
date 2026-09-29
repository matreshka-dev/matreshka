import { ServerComponentClass } from "../enums/server-component-class";
import type { OutputConfig } from "./output-config";

export type QrCodeConfig = {
  class: ServerComponentClass.QrCode;
} & OutputConfig<string>;
