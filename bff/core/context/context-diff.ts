import type {
  ContextDiffBranch,
  ContextDiffNode,
  InsertOperation,
  MoveOperation,
} from "@matreshka/client-bff-protocol/messages/bff-to-client/context/context-values-message";
import type {
  Json,
  JsonPrimitive,
} from "@matreshka/client-bff-protocol/types/json";
import { applyContextDiff } from "@matreshka/shared/utils/objects-diff";

/** Сравнение элементов массива. По умолчанию — уникальный id, затем глубокое равенство. */
export type ContextDiffIdentity = (previous: Json, next: Json) => boolean;

type Pair = {
  oldIndex: number;
  newIndex: number;
};

type DiffCandidate = {
  diff: ContextDiffNode;
  size: number;
  priority: number;
  order: number;
};

/**
 * Partial tree между двумя JSON-значениями.
 *
 * undefined — изменений нет.
 *
 * Входные значения не мутируются.
 */
export function createContextDiff(
  previous: Json,
  next: Json,
  identity?: ContextDiffIdentity,
): ContextDiffNode | undefined {
  return createNodeDiff(toJsonData(previous), toJsonData(next), identity);
}

/**
 * Убирает свойства со значением undefined.
 *
 * В JSON такого значения нет. Иначе diff получает {$set: undefined}
 * и applyContextDiff бросает ContextDiffError.
 * Дыра в массиве становится null, как при JSON.stringify.
 */
function toJsonData(value: Json): Json {
  if (Array.isArray(value)) {
    let copy: Json[] | undefined;

    for (let index = 0; index < value.length; index++) {
      const item = value[index] as Json | undefined;
      const normalized = item === undefined ? null : toJsonData(item);

      if (copy) {
        copy.push(normalized);
        continue;
      }

      if (normalized !== item) {
        copy = value.slice(0, index);
        copy.push(normalized);
      }
    }

    return copy ?? value;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  let copy: Record<string, Json> | undefined;

  for (const key of Object.keys(value)) {
    const item = value[key] as Json | undefined;

    if (item === undefined) {
      copy ??= { ...value };
      delete copy[key];
      continue;
    }

    const normalized = toJsonData(item);

    if (normalized !== item) {
      copy ??= { ...value };
      copy[key] = normalized;
    }
  }

  return copy ?? value;
}

export function isContextDiffBranch(
  diff: ContextDiffNode,
): diff is ContextDiffBranch {
  return isPlainObject(diff);
}

export function isEmptyContextDiff(diff: ContextDiffNode | undefined): boolean {
  if (diff === undefined) {
    return true;
  }

  if (Array.isArray(diff)) {
    return diff.length === 0;
  }

  if (isPlainObject(diff)) {
    return Object.keys(diff).length === 0;
  }

  return false;
}

/**
 * Создаёт diff для одного узла.
 *
 * Генерирует несколько допустимых вариантов и выбирает
 * наиболее компактный по размеру JSON.
 */
function createNodeDiff(
  previous: Json,
  next: Json,
  identity: ContextDiffIdentity | undefined,
): ContextDiffNode | undefined {
  if (deepEqual(previous, next)) {
    return undefined;
  }

  const candidates: DiffCandidate[] = [toCandidate(createSetNode(next), 2)];

  if (isPlainObject(previous) && isPlainObject(next)) {
    const partial = createObjectCandidate(previous, next, identity);

    if (partial && verifyDiff(previous, next, partial)) {
      candidates.push(toCandidate(partial, 0));
    }
  }

  if (Array.isArray(previous) && Array.isArray(next)) {
    for (const partial of createArrayCandidates(previous, next, identity)) {
      if (verifyDiff(previous, next, partial)) {
        candidates.push(toCandidate(partial, 0));
      }
    }
  }

  return selectBestCandidate(candidates).diff;
}

/**
 * Создаёт представление полной замены узла.
 *
 * Примитивы передаются непосредственно.
 * Массивы и полная замена объекта требуют явного $set:
 * массив в partial tree обновляет элементы по позиции.
 */
function createSetNode(next: Json): ContextDiffNode {
  if (isJsonPrimitive(next)) {
    return next;
  }

  return { $set: structuredClone(next) };
}

/**
 * Запись нового значения.
 *
 * Новый объект — частичное дерево свойств от пустого объекта,
 * если оно короче $set. Пустой объект и массив остаются $set.
 */
function createAssignment(
  next: Json,
  identity: ContextDiffIdentity | undefined,
): ContextDiffNode {
  if (!isPlainObject(next)) {
    return createSetNode(next);
  }

  return createNodeDiff({}, next, identity) ?? createSetNode(next);
}

/**
 * Создаёт частичное обновление объекта.
 *
 * $remove содержит имена непосредственно удаляемых свойств.
 * Остальные свойства содержат дочерние diff.
 */
function createObjectCandidate(
  previous: Record<string, Json>,
  next: Record<string, Json>,
  identity: ContextDiffIdentity | undefined,
): ContextDiffBranch | undefined {
  const remove: string[] = [];
  const children = new Map<string, ContextDiffNode>();

  for (const key of uniqueKeys(previous, next).sort()) {
    const inPrevious = Object.prototype.hasOwnProperty.call(previous, key);
    const inNext = Object.prototype.hasOwnProperty.call(next, key);

    if (inPrevious && !inNext) {
      remove.push(key);
      continue;
    }

    if (!inPrevious && inNext) {
      if (isReservedKey(key)) {
        return undefined;
      }

      children.set(key, createAssignment(next[key], identity));
      continue;
    }

    if (deepEqual(previous[key], next[key])) {
      continue;
    }

    if (isReservedKey(key)) {
      return undefined;
    }

    const child = createNodeDiff(previous[key], next[key], identity);

    if (child !== undefined) {
      children.set(key, child);
    }
  }

  if (remove.length === 0 && children.size === 0) {
    return undefined;
  }

  const node: ContextDiffBranch = {};

  if (remove.length > 0) {
    node.$remove = remove;
  }

  for (const key of [...children.keys()].sort()) {
    node[key] = children.get(key);
  }

  return node;
}

/**
 * Создаёт кандидаты частичного обновления массива.
 *
 * Поддерживаются:
 * - удаление;
 * - перемещение;
 * - вставка последовательности;
 * - обновление существующих элементов;
 * - добавление элементов в конец.
 *
 * Если преобразование невозможно представить корректно,
 * возвращается пустой список кандидатов.
 */
function createArrayCandidates(
  previous: Json[],
  next: Json[],
  identity: ContextDiffIdentity | undefined,
): ContextDiffNode[] {
  const pairs = matchArrayElements(previous, next, identity);

  if (!pairs) {
    return [];
  }

  const removed = detectRemovals(previous.length, pairs);
  const moves = detectMoves(pairs);

  if (!moves) {
    return [];
  }

  const updates = createIndexedUpdates(previous, next, pairs, identity);
  const inserts = detectInserts(next, pairs);

  const candidates: ContextDiffNode[] = [];
  const branch = createArrayBranch(removed, moves, inserts, updates);

  if (branch) {
    candidates.push(branch);
  }

  if (isPureSuffix(inserts, pairs, next.length)) {
    const suffix = createArrayBranch(
      removed,
      moves,
      [],
      [...updates, ...suffixUpdates(inserts, identity)],
    );

    if (suffix) {
      candidates.push(suffix);
    }
  }

  if (
    removed.length === 0 &&
    moves.length === 0 &&
    next.length === previous.length
  ) {
    const positional = createPositionalArray(updates);

    if (positional) {
      candidates.push(positional);
    }
  }

  return candidates;
}

/**
 * Плотный префикс до последнего изменённого элемента.
 *
 * {} сохраняет элемент. Хвост без изменений в diff не входит.
 * Используется только для обновления на тех же позициях:
 * удаления и перемещения представляются отдельной веткой.
 */
function createPositionalArray(
  updates: Array<{
    index: number;
    diff: ContextDiffNode;
  }>,
): ContextDiffNode[] | undefined {
  if (updates.length === 0) {
    return undefined;
  }

  const lastIndex = updates[updates.length - 1].index;
  const slots: ContextDiffNode[] = [];

  for (let index = 0; index <= lastIndex; index++) {
    slots.push({});
  }

  for (const update of updates) {
    slots[update.index] = update.diff;
  }

  return slots;
}

/**
 * Сопоставляет элементы старого и нового массивов.
 *
 * Приоритет:
 * 1. Пользовательская identity-функция.
 * 2. Уникальный id.
 * 3. Глубокое равенство.
 * 4. Позиционное сопоставление оставшихся элементов.
 *
 * Несопоставленные элементы нового массива становятся вставками.
 * Соседние вставки схлопываются в одну последовательность.
 */
function matchArrayElements(
  previous: Json[],
  next: Json[],
  identity: ContextDiffIdentity | undefined,
): Pair[] | undefined {
  const used = new Set<number>();
  const pairs: Pair[] = [];
  const unmatched: number[] = [];

  const ids = identity ? undefined : uniqueIds(previous, next);

  for (let newIndex = 0; newIndex < next.length; newIndex++) {
    const oldIndex = findIdentityMatch(
      previous,
      next[newIndex],
      used,
      identity,
      ids,
    );

    if (oldIndex === undefined) {
      unmatched.push(newIndex);
      continue;
    }

    used.add(oldIndex);

    pairs.push({
      oldIndex,
      newIndex,
    });
  }

  const leftovers: number[] = [];

  for (const newIndex of unmatched) {
    const oldIndex = findEqualMatch(previous, next[newIndex], used);

    if (oldIndex === undefined) {
      leftovers.push(newIndex);
      continue;
    }

    used.add(oldIndex);

    pairs.push({
      oldIndex,
      newIndex,
    });
  }

  for (const newIndex of leftovers) {
    const oldIndex = findUnused(previous.length, used);

    if (oldIndex === undefined) {
      continue;
    }

    used.add(oldIndex);

    pairs.push({
      oldIndex,
      newIndex,
    });
  }

  return pairs;
}

function findIdentityMatch(
  previous: Json[],
  nextItem: Json,
  used: Set<number>,
  identity: ContextDiffIdentity | undefined,
  ids: Map<string, number> | undefined,
): number | undefined {
  if (identity) {
    for (let oldIndex = 0; oldIndex < previous.length; oldIndex++) {
      if (used.has(oldIndex)) {
        continue;
      }

      if (identity(previous[oldIndex], nextItem)) {
        return oldIndex;
      }
    }

    return undefined;
  }

  const id = readId(nextItem);

  if (id === undefined || !ids) {
    return undefined;
  }

  const oldIndex = ids.get(idKey(id));

  if (oldIndex === undefined || used.has(oldIndex)) {
    return undefined;
  }

  return oldIndex;
}

function findEqualMatch(
  previous: Json[],
  nextItem: Json,
  used: Set<number>,
): number | undefined {
  for (let oldIndex = 0; oldIndex < previous.length; oldIndex++) {
    if (used.has(oldIndex)) {
      continue;
    }

    if (deepEqual(previous[oldIndex], nextItem)) {
      return oldIndex;
    }
  }

  return undefined;
}

function findUnused(length: number, used: Set<number>): number | undefined {
  for (let oldIndex = 0; oldIndex < length; oldIndex++) {
    if (!used.has(oldIndex)) {
      return oldIndex;
    }
  }

  return undefined;
}

function uniqueIds(previous: Json[], next: Json[]): Map<string, number> {
  const previousCounts = countIds(previous);
  const nextCounts = countIds(next);

  const matches = new Map<string, number>();

  previous.forEach((item, index) => {
    const id = readId(item);

    if (id === undefined) {
      return;
    }

    const key = idKey(id);

    if (previousCounts.get(key) !== 1 || nextCounts.get(key) !== 1) {
      return;
    }

    matches.set(key, index);
  });

  return matches;
}

function countIds(items: Json[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const item of items) {
    const id = readId(item);

    if (id === undefined) {
      continue;
    }

    const key = idKey(id);

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function readId(value: Json): string | number | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const id = value.id;

  if (typeof id === "string") {
    return id;
  }

  if (typeof id === "number" && Number.isFinite(id)) {
    return id;
  }

  return undefined;
}

function idKey(id: string | number): string {
  return typeof id === "number" ? `n:${id}` : `s:${id}`;
}

function detectRemovals(length: number, pairs: Pair[]): number[] {
  const used = new Set(pairs.map((pair) => pair.oldIndex));

  const removed: number[] = [];

  for (let index = 0; index < length; index++) {
    if (!used.has(index)) {
      removed.push(index);
    }
  }

  return removed;
}

/**
 * Вычисляет минимальный набор перемещений.
 *
 * Индексы операций относятся к массиву после удаления
 * и применяются последовательно.
 */
function detectMoves(pairs: Pair[]): MoveOperation | undefined {
  const afterRemove = pairs
    .slice()
    .sort((left, right) => left.oldIndex - right.oldIndex)
    .map((pair) => pair.oldIndex);

  const target = pairs
    .slice()
    .sort((left, right) => left.newIndex - right.newIndex)
    .map((pair) => pair.oldIndex);

  const lisMoves = movesByLis(afterRemove, target);
  const greedyMoves = movesByGreedy(afterRemove, target);

  const workable = [lisMoves, greedyMoves].filter((moves) =>
    sameOrder(simulateMoves(afterRemove, moves), target),
  );

  if (workable.length === 0) {
    return undefined;
  }

  workable.sort((left, right) => left.length - right.length);

  return workable[0];
}

function movesByLis(source: number[], target: number[]): MoveOperation {
  if (source.length === 0) {
    return [];
  }

  const targetPos = new Map<number, number>();

  target.forEach((id, index) => {
    targetPos.set(id, index);
  });

  const ranks = source.map((id) => targetPos.get(id) ?? 0);

  const frozen = new Set(lisIndices(ranks).map((index) => source[index]));

  const items = source.slice();
  const moves: MoveOperation = [];

  for (const item of target) {
    if (frozen.has(item)) {
      continue;
    }

    const from = items.indexOf(item);
    const to = targetPos.get(item) ?? 0;

    if (from === to) {
      continue;
    }

    items.splice(from, 1);
    items.splice(to, 0, item);

    moves.push([from, to]);
  }

  return moves;
}

function movesByGreedy(source: number[], target: number[]): MoveOperation {
  const items = source.slice();
  const moves: MoveOperation = [];

  for (let index = 0; index < target.length; index++) {
    if (items[index] === target[index]) {
      continue;
    }

    const from = items.indexOf(target[index]);

    const [item] = items.splice(from, 1);

    items.splice(index, 0, item);

    moves.push([from, index]);
  }

  return moves;
}

function simulateMoves(source: number[], moves: MoveOperation): number[] {
  const items = source.slice();

  for (const [from, to] of moves) {
    if (from < 0 || from >= items.length || to < 0 || to >= items.length) {
      return [];
    }

    const [item] = items.splice(from, 1);

    items.splice(to, 0, item);
  }

  return items;
}

function sameOrder(left: number[], right: number[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => item === right[index]);
}

function lisIndices(values: number[]): number[] {
  const tails: number[] = [];

  const previous = new Array<number>(values.length).fill(-1);

  for (let index = 0; index < values.length; index++) {
    let low = 0;
    let high = tails.length;

    while (low < high) {
      const mid = (low + high) >> 1;

      if (values[tails[mid]] < values[index]) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    if (low > 0) {
      previous[index] = tails[low - 1];
    }

    if (low === tails.length) {
      tails.push(index);
    } else {
      tails[low] = index;
    }
  }

  const result: number[] = [];

  if (tails.length === 0) {
    return result;
  }

  for (
    let index = tails[tails.length - 1];
    index !== -1;
    index = previous[index]
  ) {
    result.push(index);
  }

  result.reverse();

  return result;
}

/**
 * Создаёт обновления элементов массива.
 *
 * Существующие элементы адресуются по итоговым индексам.
 * Новые элементы передаются отдельно через $insert.
 */
function createIndexedUpdates(
  previous: Json[],
  next: Json[],
  pairs: Pair[],
  identity: ContextDiffIdentity | undefined,
): Array<{ index: number; diff: ContextDiffNode }> {
  const updates: Array<{
    index: number;
    diff: ContextDiffNode;
  }> = [];

  for (const pair of pairs) {
    const child = createNodeDiff(
      previous[pair.oldIndex],
      next[pair.newIndex],
      identity,
    );

    if (child !== undefined) {
      updates.push({
        index: pair.newIndex,
        diff: child,
      });
    }
  }

  updates.sort((left, right) => left.index - right.index);

  return updates;
}

/**
 * Группирует соседние несопоставленные элементы.
 *
 * Индекс — позиция в итоговом массиве. При последовательном применении
 * снизу вверх он совпадает с позицией после предыдущих вставок.
 */
function detectInserts(next: Json[], pairs: Pair[]): InsertOperation {
  const matched = new Set(pairs.map((pair) => pair.newIndex));
  const inserts: InsertOperation = [];

  let index = 0;

  while (index < next.length) {
    if (matched.has(index)) {
      index += 1;
      continue;
    }

    const start = index;
    const elements: Json[] = [];

    while (index < next.length && !matched.has(index)) {
      elements.push(structuredClone(next[index]));
      index += 1;
    }

    inserts.push([start, elements]);
  }

  return inserts;
}

function isPureSuffix(
  inserts: InsertOperation,
  pairs: Pair[],
  nextLength: number,
): boolean {
  if (inserts.length !== 1) {
    return false;
  }

  const [index, elements] = inserts[0];

  return index === pairs.length && index + elements.length === nextLength;
}

function suffixUpdates(
  inserts: InsertOperation,
  identity: ContextDiffIdentity | undefined,
): Array<{ index: number; diff: ContextDiffNode }> {
  const [start, elements] = inserts[0];

  return elements.map((element, offset) => ({
    index: start + offset,
    diff: createAssignment(element, identity),
  }));
}

function createArrayBranch(
  removed: number[],
  moves: MoveOperation,
  inserts: InsertOperation,
  updates: Array<{
    index: number;
    diff: ContextDiffNode;
  }>,
): ContextDiffBranch | undefined {
  if (
    removed.length === 0 &&
    moves.length === 0 &&
    inserts.length === 0 &&
    updates.length === 0
  ) {
    return undefined;
  }

  const node: ContextDiffBranch = {};

  if (removed.length > 0) {
    node.$remove = removed;
  }

  if (moves.length > 0) {
    node.$move = moves;
  }

  if (inserts.length > 0) {
    node.$insert = inserts;
  }

  for (const update of updates) {
    node[String(update.index)] = update.diff;
  }

  return node;
}

function verifyDiff(
  previous: Json,
  next: Json,
  diff: ContextDiffNode,
): boolean {
  return deepEqual(applyContextDiff(previous, diff), next);
}

function toCandidate(diff: ContextDiffNode, order: number): DiffCandidate {
  return {
    diff,
    size: serializedSize(diff),
    priority: priorityOf(diff),
    order,
  };
}

function selectBestCandidate(candidates: DiffCandidate[]): DiffCandidate {
  return candidates.sort((left, right) => {
    if (left.size !== right.size) {
      return left.size - right.size;
    }

    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.order - right.order;
  })[0];
}

function priorityOf(diff: ContextDiffNode): number {
  if (isJsonPrimitive(diff)) {
    return 3;
  }

  if (Array.isArray(diff)) {
    return 1;
  }

  if (Object.prototype.hasOwnProperty.call(diff, "$set")) {
    return 3;
  }

  if (
    diff.$remove !== undefined ||
    diff.$move !== undefined ||
    diff.$insert !== undefined
  ) {
    return 2;
  }

  return 1;
}

function serializedSize(value: ContextDiffNode): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function uniqueKeys(
  previous: Record<string, Json>,
  next: Record<string, Json>,
): string[] {
  return [...new Set([...Object.keys(previous), ...Object.keys(next)])];
}

function isReservedKey(key: string): boolean {
  return key.startsWith("$");
}

function deepEqual(left: Json, right: Json): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((item, index) => deepEqual(item, right[index]));
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        deepEqual(left[key], right[key]),
    );
  }

  return false;
}

function isJsonPrimitive(value: ContextDiffNode): value is JsonPrimitive {
  if (value === null) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return typeof value === "string" || typeof value === "boolean";
}

function isPlainObject(value: unknown): value is Record<string, Json> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}
