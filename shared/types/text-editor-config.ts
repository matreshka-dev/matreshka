import { ServerComponentClass } from "../enums/server-component-class";
import type { InputConfig } from "./input-config";

export type TextEditorConfig = {
  class: ServerComponentClass.TextEditor;
} & InputConfig;
