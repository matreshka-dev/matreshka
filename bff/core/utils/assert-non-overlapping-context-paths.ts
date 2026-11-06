/**
 * Запрещает дубли и вложенные dotted-пути в одном patch
 * (например `user` и `user.name` вместе).
 */
export function assertNonOverlappingContextPaths(paths: string[]): void {
  const sorted = [...paths].sort();
  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1]!;
    const current = sorted[i]!;
    if (current === previous || current.startsWith(`${previous}.`)) {
      throw new Error(
        `Overlapping context paths: "${previous}" and "${current}"`,
      );
    }
  }
}
