import { TextInputKind } from "../enums/text-input-kind";

export type TextInputNativeAttrs = {
  inputMode: string | undefined;
  autocomplete: string | undefined;
};

export function textInputNativeAttrs(
  kind?: TextInputKind,
): TextInputNativeAttrs {
  switch (kind) {
    case TextInputKind.Email:
      return { inputMode: "email", autocomplete: "email" };
    case TextInputKind.Tel:
      return { inputMode: "tel", autocomplete: "tel" };
    case TextInputKind.Url:
      return { inputMode: "url", autocomplete: "url" };
    case TextInputKind.Search:
      return { inputMode: "search", autocomplete: undefined };
    case TextInputKind.OneTimeCode:
      return { inputMode: "numeric", autocomplete: "one-time-code" };
    case TextInputKind.Text:
    default:
      return { inputMode: undefined, autocomplete: undefined };
  }
}
