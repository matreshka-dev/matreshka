import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { PLATFORM } from '../platforms/platform';
import { TestPlatform } from '../platforms/tests/test-platform';
import {
  ContextHubService,
  ContextNotLoadedError,
} from '../services/context-hub.service';
import { PostmanService } from '../services/postman.service';
import { SsrService } from '../services/ssr.service';
import { TestPostmanService } from '../services/tests/test-postman.service';
import { TestSsrService } from '../services/tests/test-ssr.service';
import { PreparePipe } from './prepare.pipe';

describe('PreparePipe', () => {
  function setup(impl: (v: string) => string = (v) => v): {
    pipe: PreparePipe;
    spy: ReturnType<typeof vi.spyOn>;
  } {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PostmanService,
          useClass: TestPostmanService,
        },
        {
          provide: PLATFORM,
          useClass: TestPlatform,
        },
        {
          provide: SsrService,
          useClass: TestSsrService,
        },
        ContextHubService,
      ],
    });

    const contextHub = TestBed.inject(ContextHubService);
    const spy = vi
      .spyOn(contextHub, 'replacePlaceholders')
      .mockImplementation(impl);

    const pipe = TestBed.runInInjectionContext(() => new PreparePipe());

    return { pipe, spy };
  }

  it('должен возвращать пустую строку для undefined', () => {
    const { pipe, spy } = setup();

    const result = pipe.transform(undefined);

    expect(result).toBe('');
    expect(spy).not.toHaveBeenCalled();
  });

  it('должен конвертировать число в строку без обращения к ContextHubService', () => {
    const { pipe, spy } = setup();

    const result = pipe.transform(123);

    expect(result).toBe('123');
    expect(spy).not.toHaveBeenCalled();
  });

  it('должен использовать ContextHubService для строк с плейсхолдерами и не кэшировать результат, если он изменился', () => {
    const { pipe, spy } = setup((v: string) => v.replace('@{name}', 'John'));
    const value = 'Hello @{name}';

    const first = pipe.transform(value);
    const second = pipe.transform(value);

    expect(first).toBe('Hello John');
    expect(second).toBe('Hello John');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('должен кэшировать строки без плейсхолдеров и не вызывать ContextHubService повторно', () => {
    const { pipe, spy } = setup((v: string) => v);
    const value = 'plain text';

    const first = pipe.transform(value);
    const second = pipe.transform(value);

    expect(first).toBe('plain text');
    expect(second).toBe('plain text');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('должен сохранять плейсхолдер, если его контекст уже удалён', () => {
    const { pipe } = setup(() => {
      throw new ContextNotLoadedError('missing-context', 'requests.list.0.id');
    });
    const value = 'Request @{missing-context.requests.list.0.id}';

    expect(pipe.transform(value)).toBe(value);
  });
});
