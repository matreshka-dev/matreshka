export function findContextKeys(str: string) {
  const result = new Set<string>();

  const scan = (source: string) => {
    const stack: number[] = [];
    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      if (char === '@' && i + 1 < source.length && source[i + 1] === '{') {
        stack.push(i);
        i++;
        continue;
      }
      if (char === '}') {
        const startIndex = stack.pop();
        if (startIndex !== undefined) {
          const key = source.substring(startIndex + 2, i);
          if (!result.has(key)) {
            result.add(key);
          }
          // Рекурсивный поиск внутри найденного ключа
          if (key.indexOf('@{') !== -1 && key.indexOf('}') !== -1) {
            scan(key);
          }
        }
      }
    }
  };

  scan(str);
  return Array.from(result);
}
