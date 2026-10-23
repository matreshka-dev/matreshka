import type { Json } from "./json";

/**
 * Операнд условия: литерал или ссылка на значение в контексте.
 *
 * Нужен, чтобы после JSON-сериализации отличать строковый литерал
 * от сериализованного `ContextRef` (`contextId.path`).
 */
export type SerializedOperand =
  | { kind: "literal"; value: Json }
  | { kind: "ref"; ref: string };
