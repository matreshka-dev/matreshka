export function objectSetValue(target: any, key: string, value: unknown) {
  const path = key.split('.');
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
      target = target[part];
    }
  });
  target[path[path.length - 1]] = value;
  if (typeof value === 'undefined' && Array.isArray(target)) {
    // На случай если элемент массива становится undefined, нужно его удалить из массива
    target.splice(parseInt(path[path.length - 1]), 1);
  }
}
