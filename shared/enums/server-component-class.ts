/**
 * Идентификатор класса серверного UI-компонента (поле `class` в конфиге и результат `class()` на BFF).
 */
export enum ServerComponentClass {
  App = "app", // Клас-заглушка на стороне bff
  Camera = "camera",
  Chart = "chart",
  Stack = "stack",
  Container = "container",
  Currency = "currency",
  Datetime = "datetime",
  Dialog = "dialog",
  Line = "line",
  FileUploadArea = "file-upload-area",
  ForEach = "for-each",
  Form = "form",
  Grid = "grid",
  Icon = "icon",
  Iframe = "iframe",
  Image = "image",
  Vector = "vector",
  Map = "map",
  Board = "board",
  Number = "number",
  NumberInput = "number-input",
  Page = "page",
  Password = "password",
  Popover = "popover",
  ProgressBar = "progress-bar",
  ProgressSpinner = "progress-spinner",
  QrCode = "qr-code",
  Text = "text",
  TextEditor = "text-editor",
  TextInput = "text-input",
  Textarea = "textarea",

  /**
   * Только для юнит-тестов клиента; BFF эти значения в ответах не использует.
   */
  UnitTest = "test",
  UnitTestInput = "test-input",
  UnitTestOutput = "test-output",
  UnitTestDummy = "dummy",
}
