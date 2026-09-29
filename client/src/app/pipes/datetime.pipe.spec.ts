import { describe, expect, it } from 'vitest';
import { DatetimePipe } from './datetime.pipe';

describe('DatetimePipe', () => {
  it('должен возвращать пустую строку, если значение не передано', () => {
    const pipe = new DatetimePipe();

    const result = pipe.transform(undefined);

    expect(result).toBe('');
  });

  it('должен форматировать дату и время с опциями', () => {
    const pipe = new DatetimePipe();
    const value = '2024-01-02T03:04:05.000Z';

    const result = pipe.transform(value, ['en-US'], {
      hour: '2-digit',
      minute: '2-digit',
    });

    expect(result).not.toBe('');
  });
});
