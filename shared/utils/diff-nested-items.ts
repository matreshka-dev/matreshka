export type NestedItemWithId = { id: string };

export type NestedItemsDiff<TItem extends NestedItemWithId> = {
  added: TItem[];
  removed: TItem[];
  updated: TItem[];
  unchanged: TItem[];
};

function nestedItemSignature(item: NestedItemWithId): string {
  return JSON.stringify(item);
}

/**
 * Сравнивает два flat-массива nested-items по stable `id`.
 * `updated` — id совпал, но сериализованное содержимое изменилось.
 */
export function diffNestedItems<TItem extends NestedItemWithId>(
  prev: readonly TItem[],
  next: readonly TItem[],
): NestedItemsDiff<TItem> {
  const prevById = new Map(prev.map((item) => [item.id, item]));
  const nextById = new Map(next.map((item) => [item.id, item]));

  const added: TItem[] = [];
  const removed: TItem[] = [];
  const updated: TItem[] = [];
  const unchanged: TItem[] = [];

  for (const item of next) {
    const existing = prevById.get(item.id);
    if (!existing) {
      added.push(item);
    } else if (nestedItemSignature(existing) !== nestedItemSignature(item)) {
      updated.push(item);
    } else {
      unchanged.push(item);
    }
  }

  for (const item of prev) {
    if (!nextById.has(item.id)) {
      removed.push(item);
    }
  }

  return { added, removed, updated, unchanged };
}
