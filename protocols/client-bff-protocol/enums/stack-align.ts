export enum StackMainAxisAlign {
  Start = "start",
  End = "end",
  Center = "center",
  Normal = "normal",
  /**
   * CSS `align-items: stretch`: дети занимают размер контейнера по поперечной оси.
   */
  Stretch = "stretch",
}

export enum StackCrossAxisAlign {
  Start = "start",
  End = "end",
  Center = "center",
  SpaceBetween = "space-between",
  /**
   * CSS `justify-content: stretch`: свободное место по главной оси отдаётся детям.
   */
  Stretch = "stretch",
}
