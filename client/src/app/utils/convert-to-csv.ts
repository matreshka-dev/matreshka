export function convertToCsv(data: string[][]) {
  return [
    '\ufeff',
    data
      .map(
        (row: string[]) =>
          '"' +
          row.map((cell) => cell.toString().split('"').join('""')).join('";"') +
          '"',
      )
      .join('\n'),
  ].join('');
}
