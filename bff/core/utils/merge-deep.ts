//stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
/**
 * Проверяет, является ли значение объектом (и не массивом).
 *
 * @param item Проверяемое значение.
 * @returns true, если значение является объектом (и не массивом); иначе false.
 */
function isObject(item: unknown): item is Record<string, unknown> {
  return typeof item === "object" && !Array.isArray(item);
}

/**
 * Рекурсивно объединяет свойства одного или нескольких исходных объектов с целевым объектом.
 *
 * @param target Целевой объект, в который выполняется слияние.
 * @param sources Один или несколько объектов-источников.
 * @returns Объединённый объект (тот же самый, что передан в target).
 */
export function mergeDeep(target: any, ...sources: any[]) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key] as Record<string, any>);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
