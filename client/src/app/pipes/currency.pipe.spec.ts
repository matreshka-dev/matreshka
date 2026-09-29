import { describe, expect, it } from 'vitest';
import { CurrencyPipe } from './currency.pipe';

describe('CurrencyPipe', () => {
  it('должен возвращать пустую строку для undefined', () => {
    const pipe = new CurrencyPipe();

    const result = pipe.transform(undefined, 'USD');

    expect(result).toBe('');
  });

  it('должен форматировать число в валюту (проверяем основные части результата)', () => {
    const pipe = new CurrencyPipe();
    const value = 1234.56;

    const result = pipe.transform(value, 'USD');

    expect(result).not.toBe('');
    expect(result).toMatch(/1234|1\s?234|1,234|1\.234/);
  });

  it('должен учитывать min/maxFractionDigits при форматировании', () => {
    const pipe = new CurrencyPipe();
    const value = 1234;

    const result = pipe.transform(value, 'USD', undefined, 2, 2);

    expect(result).toMatch(/\.00|,00/);
  });
});
