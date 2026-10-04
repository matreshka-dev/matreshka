import type { JsonPrimitive } from "@matreshka/shared/types/json";
import { ContextRef } from "../context/context-ref";
import {
  CompatibleContextValueRef,
  ContextValueRef,
} from "./context-value-ref";

/**
 * Ссылка на поле контекста, тип значения которого совместим с `ValueType`
 * для соответствующего native picker.
 */
export type NativePickerContextRef<
  ValueType extends JsonPrimitive,
  R extends ContextRef<any, any> = ContextRef<any, any>,
> = CompatibleContextValueRef<ValueType, R>;

/**
 * Ссылка контекста со строковым значением для native picker.
 */
export type NativePickerValueRef = ContextValueRef<string>;
