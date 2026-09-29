function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mergeOverride(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
) {
  Object.entries(source).forEach(([key, value]) => {
    if (isPlainRecord(value) && isPlainRecord(target[key])) {
      mergeOverride(target[key], value);
      return;
    }

    target[key] = structuredClone(value);
  });
}
