import { describe, expect, it } from 'vitest';

import { PasswordInputKind } from '@shared/enums/password-input-kind';
import { passwordInputAutocomplete } from '@shared/utils/password-input-autocomplete';

describe('passwordInputAutocomplete', () => {
  it('возвращает undefined по умолчанию', () => {
    expect(passwordInputAutocomplete()).toBeUndefined();
  });

  it('мапит current password kind', () => {
    expect(passwordInputAutocomplete(PasswordInputKind.CurrentPassword)).toBe(
      'current-password',
    );
  });

  it('мапит new password kind', () => {
    expect(passwordInputAutocomplete(PasswordInputKind.NewPassword)).toBe(
      'new-password',
    );
  });

  it('мапит off kind', () => {
    expect(passwordInputAutocomplete(PasswordInputKind.Off)).toBe('off');
  });
});
