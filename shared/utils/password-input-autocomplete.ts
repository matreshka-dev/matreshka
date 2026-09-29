import { PasswordInputKind } from "../enums/password-input-kind";

export function passwordInputAutocomplete(
  kind?: PasswordInputKind,
): string | undefined {
  switch (kind) {
    case PasswordInputKind.CurrentPassword:
      return "current-password";
    case PasswordInputKind.NewPassword:
      return "new-password";
    case PasswordInputKind.Off:
      return "off";
    default:
      return undefined;
  }
}
