import { describe, expect, it } from 'vitest';
import { DatePipe } from './date.pipe';

describe('DatePipe', () => {
  it('должен возвращать пустую строку, если значение не передано', () => {
    const pipe = new DatePipe();

    const result = pipe.transform(undefined);

    expect(result).toBe('');
  });

  it('должен форматировать дату из строки', () => {
    const pipe = new DatePipe();
    const value = '2024-01-02T00:00:00.000Z';

    const result = pipe.transform(value);

    expect(result).not.toBe('');
    expect(result).toContain('2024');
  });
});
