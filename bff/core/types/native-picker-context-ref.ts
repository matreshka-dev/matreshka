import type { JsonPrimitive } from "@matreshka/shared/types/json";
import { ContextRef, ContextRefValue } from "../context/context-ref";

/**
 * Ссылка на поле контекста, тип значения которого совместим с `ValueType`
 * для соответствующего native picker.
 */
export type NativePickerContextRef<
  ValueType extends JsonPrimitive,
  R extends ContextRef<any, any> = ContextRef<any, any>,
> = ValueType extends ContextRefValue<R> ? R : never;
