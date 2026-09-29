import { describe, expect, it } from 'vitest';
import { RemPipe } from './rem.pipe';

describe('RemPipe', () => {
  it('create an instance', () => {
    const pipe = new RemPipe();
    expect(pipe).toBeTruthy();
  });
});
