import { Paths, PathValue } from "ts-essentials";

export function setObjectProperty<
  T extends Record<string, unknown>,
  K extends Paths<T>,
>(object: T, key: K, value: PathValue<T, K>): void;
export function setObjectProperty(
  object: Record<string, unknown>,
  key: string,
  value: unknown,
) {
  const path = key.split(".");
  let target: Record<string, any> = object as Record<string, any>;
  path.forEach((part, index) => {
    if (index < path.length - 1) {
      // Последний элемент участвует в вычислениях, но не в формировании
      if (target[part] === undefined) {
        if (/^[0-9]*$/.test(path[index + 1])) {
          // Если следующий элемент число, значит нужно создать массив
          target[part] = [];
        } else {
          // Иначе объект
          target[part] = {};
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      target = target[part];
    }
  });
  target[path[path.length - 1]] = value as any;
  if (typeof value === "undefined" && Array.isArray(target)) {
    // На случай если элемент массива становится undefined, нужно его удалить из массива
    target.splice(parseInt(path[path.length - 1]), 1);
  }
}
