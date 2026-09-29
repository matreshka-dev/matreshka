import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppPageMessage } from '@shared/messages/bff-to-client/app';
import type { PageConfig } from '@shared/types/page-config';
import { PostmanService } from '../services/postman.service';
import { routeResolver } from './route.resolver';

class TestPostmanService {
  incomingMessage$ = new Subject<unknown>();
}

describe('routeResolver', () => {
  let postman: TestPostmanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: PostmanService, useClass: TestPostmanService }],
    });

    postman = TestBed.inject(PostmanService) as unknown as TestPostmanService;
  });

  it('должен резолвить PageConfig из AppPageMessage', async () => {
    const payload: PageConfig = {
      id: 'test-page',
      title: 'Test page',
    } as unknown as PageConfig;

    const resultPromise = firstValueFrom(
      TestBed.runInInjectionContext(
        () =>
          routeResolver(
            {} as any,
            {} as any,
          ) as unknown as Observable<PageConfig>,
      ),
    );

    postman.incomingMessage$.next(new AppPageMessage(payload));

    const result = await resultPromise;

    expect(result).toBe(payload);
  });

  it('должен игнорировать сообщения, не являющиеся AppPageMessage', async () => {
    const payload: PageConfig = {
      id: 'test-page-2',
      title: 'Test page 2',
    } as unknown as PageConfig;

    const resultPromise = firstValueFrom(
      TestBed.runInInjectionContext(
        () =>
          routeResolver(
            {} as any,
            {} as any,
          ) as unknown as Observable<PageConfig>,
      ),
    );

    // Сначала отправляем нерелевантное сообщение
    postman.incomingMessage$.next({ some: 'other-message' });
    // Теперь отправляем корректное сообщение
    postman.incomingMessage$.next(new AppPageMessage(payload));

    const result = await resultPromise;

    expect(result).toBe(payload);
  });
});
