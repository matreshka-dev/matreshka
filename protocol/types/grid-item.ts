/** Значение grid-line по спецификации CSS Grid Layout. */
export type GridLine = number | "auto" | { span: number };

/**
 * Размещение элемента в CSS Grid.
 * Соответствует свойствам grid-column-start/end и grid-row-start/end.
 */
export type GridItem = {
  columnStart?: GridLine;
  columnEnd?: GridLine;
  rowStart?: GridLine;
  rowEnd?: GridLine;
};
