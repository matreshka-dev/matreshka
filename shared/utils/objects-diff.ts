import type {
  ContextDiffBranch,
  ContextDiffNode,
  InsertOperation,
  MoveOperation,
} from "@matreshka/client-bff-protocol/messages/bff-to-client/context/context-values-message";
import type { Json } from "@matreshka/client-bff-protocol/types/json";

const RESERVED_KEYS = new Set(["$set", "$remove", "$move", "$insert"]);
const DECIMAL_INDEX = /^(0|[1-9][0-9]*)$/;

export class ContextDiffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContextDiffError";
  }
}

/**
 * Применяет partial tree.
 *
 * undefined, {} и [] означают отсутствие изменений.
 *
 * Непустой массив обновляет элементы по позиции и не длиннее исходного.
 * Хвост исходного массива за пределами diff сохраняется.
 * Полная замена массива или объекта передаётся через $set.
 * Отсутствующий объект создаётся непустым деревом свойств, без $set.
 *
 * Ошибка валидации не меняет previous.
 */
export function applyContextDiff<T>(
  previous: T,
  diff: ContextDiffNode | undefined,
): T {
  if (diff === undefined) {
    return previous;
  }

  return applyNode(previous as Json, diff) as T;
}

function applyNode(value: Json | undefined, diff: ContextDiffNode): Json {
  if (isEmptyNode(diff)) {
    if (value === undefined) {
      throw new ContextDiffError(
        "Cannot apply an empty diff to a missing value",
      );
    }

    return value;
  }

  if (isJsonPrimitive(diff)) {
    return diff;
  }

  if (Array.isArray(diff)) {
    return applyPositionalArray(value, diff);
  }

  if (!isPlainObject(diff)) {
    throw new ContextDiffError("Diff node must be a JSON value");
  }

  return applyBranch(value, diff);
}

function applyBranch(value: Json | undefined, diff: ContextDiffBranch): Json {
  if (Object.prototype.hasOwnProperty.call(diff, "$set")) {
    const keys = Object.keys(diff);

    if (keys.length !== 1) {
      throw new ContextDiffError(
        "$set cannot be combined with other instructions",
      );
    }

    assertJsonValue(diff.$set, "$set");

    if (diff.$set === undefined) {
      throw new ContextDiffError("$set must be a JSON value");
    }

    return cloneJson(diff.$set);
  }

  for (const key of Object.keys(diff)) {
    if (key.startsWith("$") && !RESERVED_KEYS.has(key)) {
      throw new ContextDiffError(`Unknown operation "${key}"`);
    }
  }

  if (Array.isArray(value)) {
    return applyArray(value, diff);
  }

  if (isPlainObject(value)) {
    return applyObject(value, diff);
  }

  throw new ContextDiffError(
    "Cannot apply child operations to a primitive value",
  );
}

function applyPositionalArray(
  value: Json | undefined,
  diff: ContextDiffNode[],
): Json[] {
  if (!Array.isArray(value)) {
    throw new ContextDiffError(
      "Cannot apply an array diff to a non-array value",
    );
  }

  if (diff.length > value.length) {
    throw new ContextDiffError("Array diff is longer than the target array");
  }

  const next = value.slice();

  for (let index = 0; index < diff.length; index++) {
    next[index] = applyNode(next[index], diff[index]);
  }

  return next;
}

function applyArray(source: Json[], diff: ContextDiffBranch): Json[] {
  const remove = readRemoveIndexes(diff.$remove, source.length);
  const removeSet = new Set(remove);

  const next = source.filter((_, index) => !removeSet.has(index));

  for (const [from, to] of readMoves(diff.$move)) {
    if (from < 0 || from >= next.length) {
      throw new ContextDiffError(`move from ${from} is out of range`);
    }

    const [item] = next.splice(from, 1);

    if (to < 0 || to > next.length) {
      throw new ContextDiffError(`move to ${to} is out of range`);
    }

    next.splice(to, 0, item);
  }

  for (const [index, elements] of readInserts(diff.$insert)) {
    if (index > next.length) {
      throw new ContextDiffError(`insert index ${index} is out of range`);
    }

    next.splice(index, 0, ...elements.map((element) => cloneJson(element)));
  }

  for (const key of childKeys(diff)) {
    const index = parseIndex(key);
    const child = diff[key] as ContextDiffNode;

    if (index < next.length) {
      next[index] = applyNode(next[index], child);
      continue;
    }

    if (index === next.length && isAssignment(child)) {
      next.push(applyNode(undefined, child));
      continue;
    }

    if (index === next.length && isObjectPatch(child)) {
      next.push(applyNode({}, child));
      continue;
    }

    throw new ContextDiffError(`Index "${key}" is out of range`);
  }

  return next;
}

function applyObject(
  source: Record<string, Json>,
  diff: ContextDiffBranch,
): Record<string, Json> {
  if (diff.$move !== undefined) {
    throw new ContextDiffError("move is only valid for arrays");
  }

  if (diff.$insert !== undefined) {
    throw new ContextDiffError("insert is only valid for arrays");
  }

  const remove = readRemoveKeys(diff.$remove);
  const children = childKeys(diff);

  for (const key of remove) {
    if (children.includes(key)) {
      throw new ContextDiffError(
        `Property "${key}" cannot be removed and updated simultaneously`,
      );
    }
  }

  const next: Record<string, Json> = {
    ...source,
  };

  for (const key of remove) {
    if (!Object.prototype.hasOwnProperty.call(next, key)) {
      throw new ContextDiffError(`Cannot remove missing property "${key}"`);
    }

    delete next[key];
  }

  for (const key of children) {
    const child = diff[key] as ContextDiffNode;

    if (!Object.prototype.hasOwnProperty.call(next, key)) {
      if (isAssignment(child)) {
        next[key] = applyNode(undefined, child);
        continue;
      }

      if (isObjectPatch(child)) {
        next[key] = applyNode({}, child);
        continue;
      }

      throw new ContextDiffError(`Cannot update missing property "${key}"`);
    }

    next[key] = applyNode(next[key], child);
  }

  return next;
}

/**
 * Примитив и $set можно записать в отсутствующее свойство.
 *
 * Массив — позиционное обновление существующего массива,
 * поэтому новое значение-массив передаётся через {$set: []}.
 */
function isAssignment(diff: ContextDiffNode): boolean {
  if (isJsonPrimitive(diff)) {
    return true;
  }

  if (!isPlainObject(diff)) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(diff, "$set");
}

/**
 * Непустой объект без структурных операций создаёт отсутствующий объект.
 *
 * {} по-прежнему означает «нет изменений», а не пустой объект.
 * $remove, $move и $insert требуют уже существующий узел.
 */
function isObjectPatch(diff: ContextDiffNode): diff is ContextDiffBranch {
  if (!isPlainObject(diff) || isEmptyNode(diff)) {
    return false;
  }

  const branch = diff as ContextDiffBranch;

  return (
    !Object.prototype.hasOwnProperty.call(branch, "$set") &&
    branch.$remove === undefined &&
    branch.$move === undefined &&
    branch.$insert === undefined
  );
}

function childKeys(diff: ContextDiffBranch): string[] {
  return Object.keys(diff)
    .filter((key) => !RESERVED_KEYS.has(key))
    .sort((left, right) => {
      const leftIndex = DECIMAL_INDEX.test(left) ? Number(left) : Number.NaN;

      const rightIndex = DECIMAL_INDEX.test(right) ? Number(right) : Number.NaN;

      if (!Number.isNaN(leftIndex) && !Number.isNaN(rightIndex)) {
        return leftIndex - rightIndex;
      }

      if (left < right) {
        return -1;
      }

      if (left > right) {
        return 1;
      }

      return 0;
    });
}

function readRemoveKeys(raw: ContextDiffBranch["$remove"]): string[] {
  if (raw === undefined) {
    return [];
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ContextDiffError("$remove must be a non-empty array");
  }

  const keys: string[] = [];

  for (const item of raw) {
    if (typeof item !== "string" || item.length === 0) {
      throw new ContextDiffError("$remove for an object must contain strings");
    }

    keys.push(item);
  }

  assertUnique(keys, (key) => `Duplicate remove key "${key}"`);

  return keys;
}

function readRemoveIndexes(
  raw: ContextDiffBranch["$remove"],
  length: number,
): number[] {
  if (raw === undefined) {
    return [];
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ContextDiffError("$remove must be a non-empty array");
  }

  const indexes: number[] = [];

  for (const item of raw) {
    if (typeof item !== "number" || !isWholeIndex(item) || item >= length) {
      throw new ContextDiffError("$remove index is out of range");
    }

    indexes.push(item);
  }

  assertUnique(indexes, (index) => `Duplicate remove index "${index}"`);

  return indexes;
}

function readMoves(raw: ContextDiffBranch["$move"]): MoveOperation {
  if (raw === undefined) {
    return [];
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ContextDiffError("$move must be a non-empty array");
  }

  const moves: MoveOperation = [];

  for (const item of raw) {
    if (!Array.isArray(item) || item.length !== 2) {
      throw new ContextDiffError("$move pair must contain two indexes");
    }

    const [from, to] = item;

    if (!isWholeIndex(from) || !isWholeIndex(to)) {
      throw new ContextDiffError("$move indexes must be non-negative integers");
    }

    moves.push([from, to]);
  }

  return moves;
}

function readInserts(raw: ContextDiffBranch["$insert"]): InsertOperation {
  if (raw === undefined) {
    return [];
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ContextDiffError("$insert must be a non-empty array");
  }

  const inserts: InsertOperation = [];

  for (const item of raw) {
    if (!Array.isArray(item) || item.length !== 2) {
      throw new ContextDiffError(
        "$insert pair must contain an index and elements",
      );
    }

    const [index, elements] = item;

    if (!isWholeIndex(index)) {
      throw new ContextDiffError(
        "$insert index must be a non-negative integer",
      );
    }

    if (!Array.isArray(elements) || elements.length === 0) {
      throw new ContextDiffError("$insert elements must be a non-empty array");
    }

    for (const element of elements) {
      assertJsonValue(element, "$insert element");
    }

    inserts.push([index, elements]);
  }

  return inserts;
}

function parseIndex(key: string): number {
  if (!DECIMAL_INDEX.test(key)) {
    throw new ContextDiffError(`Invalid array index "${key}"`);
  }

  const index = Number(key);

  if (!Number.isSafeInteger(index)) {
    throw new ContextDiffError(`Index "${key}" is out of range`);
  }

  return index;
}

function assertUnique<T>(values: T[], message: (value: T) => string): void {
  const seen = new Set<T>();

  for (const value of values) {
    if (seen.has(value)) {
      throw new ContextDiffError(message(value));
    }

    seen.add(value);
  }
}

function isEmptyNode(diff: ContextDiffNode): boolean {
  if (Array.isArray(diff)) {
    return diff.length === 0;
  }

  return isPlainObject(diff) && Object.keys(diff).length === 0;
}

function isWholeIndex(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isJsonPrimitive(value: unknown): value is Exclude<Json, object> {
  if (value === null) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return typeof value === "string" || typeof value === "boolean";
}

function assertJsonValue(value: unknown, label: string): void {
  if (!isJson(value)) {
    throw new ContextDiffError(`${label} must be a JSON value`);
  }
}

function isJson(value: unknown): value is Json {
  if (isJsonPrimitive(value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJson(item));
  }

  if (!isPlainObject(value)) {
    return false;
  }

  return Object.values(value).every((item) => isJson(item));
}

function isPlainObject(value: unknown): value is Record<string, Json> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function cloneJson<T extends Json>(value: T): T {
  if (typeof value === "object" && value !== null) {
    return structuredClone(value);
  }

  return value;
}
