import { describe, expect, it } from 'vitest';

import { TextInputKind } from '@shared/enums/text-input-kind';
import { textInputNativeAttrs } from '@shared/utils/text-input-native-attrs';

describe('textInputNativeAttrs', () => {
  it('возвращает пустые атрибуты по умолчанию', () => {
    expect(textInputNativeAttrs()).toEqual({
      inputMode: undefined,
      autocomplete: undefined,
    });
  });

  it('мапит text kind в пустые атрибуты', () => {
    expect(textInputNativeAttrs(TextInputKind.Text)).toEqual({
      inputMode: undefined,
      autocomplete: undefined,
    });
  });

  it('мапит email kind', () => {
    expect(textInputNativeAttrs(TextInputKind.Email)).toEqual({
      inputMode: 'email',
      autocomplete: 'email',
    });
  });

  it('мапит tel kind', () => {
    expect(textInputNativeAttrs(TextInputKind.Tel)).toEqual({
      inputMode: 'tel',
      autocomplete: 'tel',
    });
  });

  it('мапит url kind', () => {
    expect(textInputNativeAttrs(TextInputKind.Url)).toEqual({
      inputMode: 'url',
      autocomplete: 'url',
    });
  });

  it('мапит search kind', () => {
    expect(textInputNativeAttrs(TextInputKind.Search)).toEqual({
      inputMode: 'search',
      autocomplete: undefined,
    });
  });

  it('мапит one time code kind', () => {
    expect(textInputNativeAttrs(TextInputKind.OneTimeCode)).toEqual({
      inputMode: 'numeric',
      autocomplete: 'one-time-code',
    });
  });
});
