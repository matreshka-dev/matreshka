import type { Json, JsonObject, JsonPrimitive } from "../../../types/json";
import { ReliableTargetedBffToClientMessage } from "../reliable-bff-to-client-message";

export type { JsonObject, JsonPrimitive, Json as JsonValue };

/** Имена свойств объекта или исходные индексы массива. */
export type RemoveOperation = string[] | number[];

/**
 * Перемещения элементов массива. Пара `[from, to]` выполняется последовательно:
 * `from` — индекс текущего массива, `to` — позиция вставки после изъятия.
 */
export type MoveOperation = Array<[from: number, to: number]>;

/**
 * Вставки в массив. Пара `[index, elements]` выполняется последовательно:
 * `index` — позиция в массиве после `$remove`, `$move` и предыдущих вставок,
 * `elements` — последовательность сырых JSON-значений.
 */
export type InsertOperation = Array<[index: number, elements: Json[]]>;

/**
 * Узел partial tree.
 * Примитив заменяет значение, массив обновляет элементы по позиции,
 * объект — ветка операций и дочерних изменений.
 */
export type ContextDiffNode =
  | JsonPrimitive
  | ContextDiffNode[]
  | ContextDiffBranch;

/**
 * Ветка partial tree.
 * `$set` заменяет узел и не сочетается с другими ключами.
 * `$remove`, `$move` и `$insert` — операции этого узла, остальные ключи — дети.
 */
export type ContextDiffBranch = {
  $set?: Json;
  $remove?: RemoveOperation;
  $move?: MoveOperation;
  $insert?: InsertOperation;
  [key: string]: ContextDiffNode | Json | undefined;
};

export class ContextValuesMessage extends ReliableTargetedBffToClientMessage<ContextDiffBranch> {
  static readonly type = "context-values";
  constructor(
    target: string,
    public override readonly payload: ContextDiffBranch,
  ) {
    super(target, payload);
  }
}
