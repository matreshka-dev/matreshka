import { describe, expect, it } from 'vitest';
import { FilesizePipe } from './filesize.pipe';

describe('FilesizePipe', () => {
  it('должен форматировать маленькие значения в байтах', () => {
    const pipe = new FilesizePipe();

    const result = pipe.transform(500);

    expect(result).toBe('500 B');
  });

  it('должен форматировать значение в kB при использовании SI', () => {
    const pipe = new FilesizePipe();

    const result = pipe.transform(1500);

    expect(result).toBe('1.5 kB');
  });

  it('должен форматировать значение в KiB при использовании бинарных единиц', () => {
    const pipe = new FilesizePipe();

    const result = pipe.transform(1024, false, 1);

    expect(result).toBe('1.0 KiB');
  });
});
