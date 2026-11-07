import { ConditionType } from "@matreshka/client-bff-protocol/enums/condition-type";
import { ContextRef } from "../context/context-ref";
import { Condition } from "./condition";

/**
 * Условие, означающее, что значение в контексте по заданному ключу не определено.
 *
 * Параметр — `R extends ContextRef<any, any, any>`. Голый `ContextRef` раскрывается
 * в `ContextRef<JsonObject, string>`. Метод `local.set` принимает значение по пути,
 * поэтому ссылка инвариантна: при `strictFunctionTypes` конкретный ref страницы
 * в этот параметр не входит. `any` в ограничении выводит `R` из аргумента
 * и сохраняет его тип. Тот же приём у {@link contextValueEqual} и {@link contextValueIn}.
 *
 * @internal Используйте {@link contextValueUndefined} / {@link when.notDefined}.
 */
export class ContextValueUndefined<
  R extends ContextRef<any, any, any>,
> extends Condition {
  constructor(ref: R) {
    super(ConditionType.ContextValueUndefined, { ref });
  }
}

/** Функциональная форма {@link ContextValueUndefined}. */
export function contextValueUndefined<R extends ContextRef<any, any, any>>(
  ref: R,
): ContextValueUndefined<R> {
  return new ContextValueUndefined(ref);
}
