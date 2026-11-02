import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { ContextRef } from "../context/context-ref";
import { Condition } from "./condition";

/**
 * Условие, означающее, что в контексте определено значение по заданному ключу.
 *
 * Параметр — `R extends ContextRef<any, any>`. Голый `ContextRef` раскрывается
 * в `ContextRef<JsonObject, string>`. Метод `local.set` принимает значение по пути,
 * поэтому ссылка инвариантна: при `strictFunctionTypes` конкретный ref страницы
 * в этот параметр не входит. `any` в ограничении выводит `R` из аргумента
 * и сохраняет его тип. Тот же приём у {@link contextValueEqual} и {@link contextValueIn}.
 *
 * @internal Используйте {@link contextValueDefined} / {@link when.defined}.
 */
export class ContextValueDefined<
  R extends ContextRef<any, any>,
> extends Condition {
  constructor(ref: R) {
    super(ConditionType.ContextValueDefined, { ref });
  }
}

/** Функциональная форма {@link ContextValueDefined}. */
export function contextValueDefined<R extends ContextRef<any, any>>(
  ref: R,
): ContextValueDefined<R> {
  return new ContextValueDefined(ref);
}
