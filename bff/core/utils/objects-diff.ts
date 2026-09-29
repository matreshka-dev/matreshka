/**
 * Вычисляет разницу между двумя объектами и возвращает изменённые поля.
 *
 * Поддерживает вложенные объекты. Если изменились все поля вложенного объекта —
 * возвращает его целиком. В противном случае возвращает только изменённые поля.
 *
 * @param oldObj Исходный объект.
 * @param newObj Новый объект.
 * @param prefix Префикс для формирования ключей (используется при рекурсии).
 * @param diff Промежуточное хранилище отличий (используется при рекурсии).
 * @returns Объект с отличиями, где ключ — путь к полю, значение — новое значение.
 */
export const objectsDiff = (
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  prefix = "",
  diff: Record<string, unknown> = {},
) => {
  const oldObjectsKeys = Object.keys(oldObj);
  const newObjectsKeys = Object.keys(newObj);
  new Set(oldObjectsKeys.concat(newObjectsKeys)).forEach((key) => {
    // Перебор всех ключей
    if (
      typeof oldObj[key] === "object" &&
      typeof newObj[key] === "object" &&
      oldObj[key] !== null &&
      newObj[key] !== null
    ) {
      // Проверка на массивы - если это массивы, сравниваем их по ссылке
      if (Array.isArray(oldObj[key]) || Array.isArray(newObj[key])) {
        // Если один из них массив, а другой нет, или это разные ссылки - считаем измененным
        if (
          Array.isArray(oldObj[key]) !== Array.isArray(newObj[key]) ||
          oldObj[key] !== newObj[key]
        ) {
          diff[prefix + key] = newObj[key];
        }
      } else {
        // если они оба объекты, могли измениться поля внутри
        const nestedDiff = objectsDiff(
          oldObj[key],
          newObj[key],
          prefix + key + ".",
        );
        if (Object.keys(nestedDiff).length) {
          // Важно понять тип полей, которые изменились
          if (
            Object.keys(nestedDiff).length >=
            Math.max(
              Object.keys(oldObj[key]).length,
              Object.keys(newObj[key]).length,
            ) /
              2
          ) {
            // Изменилось больше половины свойств объекта (можно менять условия), тогда меняем сущность целиком для экономии трафика

            diff[prefix + key] = newObj[key];
          } else {
            diff = { ...diff, ...nestedDiff };
          }
        }
      }
    } else if (oldObj[key] !== newObj[key]) {
      diff[prefix + key] = newObj[key];
    }
  });
  return diff;
};
