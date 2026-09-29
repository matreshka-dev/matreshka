import { JsonPrimitive } from "@matreshka/shared/types/json";
import { ContextRef, ContextRefValue } from "../context/context-ref";

export type ContextRefPrimitiveValue<R extends ContextRef<any, any>> =
  R extends { readonly __valueType?: infer ValueType }
    ? Extract<ValueType, JsonPrimitive>
    : Extract<ContextRefValue<R>, JsonPrimitive>;
