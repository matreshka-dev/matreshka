import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ContextHubService } from './context-hub.service';
import { PostmanService } from './postman.service';
import { SsrService } from './ssr.service';
import { TestPostmanService } from './tests/test-postman.service';
import { TestSsrService } from './tests/test-ssr.service';

import {
  ContextInitMessage as BffContextInitMessage,
  ContextValuesMessage as BffContextValuesMessage,
  ContextDestroyMessage,
} from '@shared/messages/bff-to-client/context';
import { ClientToBffMessage } from '@shared/messages/client-to-bff/client-to-bff-message';
import { ContextInitMessage as ClientToBffContextInitMessage } from '@shared/messages/client-to-bff/context/context-init-message';
import { ContextValuesMessage as ClientToBffContextValuesMessage } from '@shared/messages/client-to-bff/context/context-values-message';
import { ContextChangeEvent } from '../types/context-change-event';

describe('Контекст', () => {
  let service: ContextHubService;
  let postman: TestPostmanService;
  let ssr: TestSsrService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ContextHubService,
        {
          provide: PostmanService,
          useClass: TestPostmanService,
        },
        { provide: SsrService, useClass: TestSsrService },
      ],
    });

    service = TestBed.inject(ContextHubService);
    postman = TestBed.inject(PostmanService) as unknown as TestPostmanService;
    ssr = TestBed.inject(SsrService) as unknown as TestSsrService;
  });

  it('инициализация контекста', () => {
    const contextId = 'ctx1';
    let initCompleted = false;

    const sentMessages: ClientToBffMessage[] = [];
    const sub = postman.outcomingMessage$.subscribe((msg) =>
      sentMessages.push(msg),
    );

    const init$ = service.init$(contextId);
    init$.subscribe((value) => {
      initCompleted = value;
    });

    // Клиент отправляет запрос на инициализацию контекста
    expect(sentMessages).toHaveLength(1);
    const initMessage = sentMessages[0] as ClientToBffContextInitMessage;
    expect(initMessage).toBeInstanceOf(ClientToBffContextInitMessage);
    expect(initMessage.target).toBe(contextId);

    // До ответа сервера контекст не загружен
    expect(service.loaded(contextId)).toBe(false);
    expect(initCompleted).toBe(false);

    // Сервер присылает значения контекста
    const initialValues = { field: 1 };
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, initialValues),
    );

    // После инициализации контекст загружен и observable инициализации срабатывает
    expect(service.loaded(contextId)).toBe(true);
    expect(initCompleted).toBe(true);
    expect(service.value('ctx1.field')).toBe(1);

    sub.unsubscribe();
  });

  it('статус загрузки', () => {
    const contextId = 'ctx-loaded';

    expect(service.loaded(contextId)).toBe(false);

    service.init$(contextId);

    // Пока нет ответа от сервера, контекст не считается загруженным
    expect(service.loaded(contextId)).toBe(false);

    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, { foo: 'bar' }),
    );

    expect(service.loaded(contextId)).toBe(true);
  });

  it('получение значения по ключу', () => {
    const contextId = 'ctx-values';

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, {
        simple: 1,
        nested: { value: 42 },
      }),
    );

    expect(service.value('ctx-values.simple')).toBe(1);
    expect(service.value('ctx-values.nested.value')).toBe(42);
  });

  it('неизвестный ключ', () => {
    const contextId = 'ctx-values';

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, {
        simple: 1,
        nested: { value: 42 },
      }),
    );

    expect(service.value('ctx-values.unknown')).toBeUndefined();
    expect(service.value('ctx-values.nested.unknown')).toBeUndefined();
  });

  it('плейсхолдер в том же контексте', () => {
    const contextId = 'ctx-same';

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, {
        keyName: 'target',
        target: 'same-context-value',
      }),
    );

    const result = service.value('ctx-same.@{ctx-same.keyName}');
    expect(result).toBe('same-context-value');
  });

  it('плейсхолдер со значением по умолчанию', () => {
    const contextId = 'ctx-default';

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, {
        defaultKey: 'default-value',
      }),
    );

    const result = service.value(
      'ctx-default.@{ctx-default.missingKey=defaultKey}',
    );
    expect(result).toBe('default-value');
  });

  it('плейсхолдер из другого контекста', () => {
    const mainId = 'ctx-main';
    const otherId = 'ctx-other';

    service.init$(otherId);
    service.init$(mainId);

    postman.incomingMessage$.next(
      new BffContextInitMessage(otherId, {
        keyName: 'field',
      }),
    );
    postman.incomingMessage$.next(
      new BffContextInitMessage(mainId, {
        field: 'cross-context-value',
      }),
    );

    const result = service.value('ctx-main.@{ctx-other.keyName}');
    expect(result).toBe('cross-context-value');
  });

  it('вложенный плейсхолдер между контекстами', () => {
    const mainId = 'ctx-main-nested';
    const ctxA = 'ctx-a';
    const ctxB = 'ctx-b';

    service.init$(ctxB);
    service.init$(ctxA);
    service.init$(mainId);

    postman.incomingMessage$.next(
      new BffContextInitMessage(ctxB, {
        keyName: 'field',
      }),
    );
    postman.incomingMessage$.next(
      new BffContextInitMessage(ctxA, {
        nestedPath: '@{ctx-b.keyName}',
      }),
    );
    postman.incomingMessage$.next(
      new BffContextInitMessage(mainId, {
        field: 'nested-cross-context-value',
      }),
    );

    const result = service.value('ctx-main-nested.@{ctx-a.nestedPath}');
    expect(result).toBe('nested-cross-context-value');
  });

  it('неизвестный плейсхолдер', () => {
    const contextId = 'ctx-empty';

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, {
        existing: 'value',
      }),
    );

    const result = service.replacePlaceholders(
      `prefix @{${contextId}.missingKey} suffix`,
    );
    expect(result).toBe('prefix  suffix');
  });

  it('серверное обновление значения', () => {
    const contextId = 'ctx-server-change';

    const sentMessages: ClientToBffMessage[] = [];
    const sub = postman.outcomingMessage$.subscribe((msg) =>
      sentMessages.push(msg),
    );

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, { field: 1 }),
    );

    const changeEvents: ContextChangeEvent[] = [];
    service.change$.subscribe((event) => changeEvents.push(event));

    // Сбрасываем сообщения после init-сообщения клиента
    sentMessages.length = 0;

    // Сервер обновляет значение контекста
    const serverChange = [{ key: 'field', value: 2 }];
    postman.incomingMessage$.next(
      new BffContextValuesMessage(contextId, serverChange),
    );

    expect(service.value('ctx-server-change.field')).toBe(2);
    expect(changeEvents).toHaveLength(1);
    expect(changeEvents[0]).toEqual({ contextId, values: serverChange });

    // При обновлении с сервера клиент не должен отправлять сообщение обратно
    expect(sentMessages).toHaveLength(0);

    sub.unsubscribe();
  });

  it('клиентское обновление значения', () => {
    const contextId = 'ctx-client-set';

    const sentMessages: ClientToBffMessage[] = [];
    const sub = postman.outcomingMessage$.subscribe((msg) =>
      sentMessages.push(msg),
    );

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, { field: 1 }),
    );

    const changeEvents: ContextChangeEvent[] = [];
    service.change$.subscribe((event) => changeEvents.push(event));

    sentMessages.length = 0;

    // Установка нового значения — должно обновить контекст, вызвать change$ и отправить сообщение на сервер
    const clientChange = [{ key: 'field', value: 2 }];
    service.setValues(contextId, clientChange);

    expect(service.value('ctx-client-set.field')).toBe(2);
    expect(changeEvents).toHaveLength(1);
    expect(changeEvents[0]).toEqual({ contextId, values: clientChange });

    expect(sentMessages).toHaveLength(1);
    const sentMessage = sentMessages[0] as ClientToBffContextValuesMessage;
    expect(sentMessage).toBeInstanceOf(ClientToBffContextValuesMessage);
    expect(sentMessage.target).toBe(contextId);
    expect(sentMessage.payload).toEqual(clientChange);

    // Повторная установка того же значения не должна ни триггерить change$, ни отправлять сообщение
    sentMessages.length = 0;
    service.setValues(contextId, clientChange);

    expect(changeEvents).toHaveLength(1);
    expect(sentMessages).toHaveLength(0);

    sub.unsubscribe();
  });

  it('переинстанс init$', () => {
    const contextId = 'ctx-repeat-init';

    const sentMessages: ClientToBffMessage[] = [];
    const sentSub = postman.outcomingMessage$.subscribe((msg) =>
      sentMessages.push(msg),
    );

    const firstInit$ = service.init$(contextId);
    const secondInit$ = service.init$(contextId);

    expect(secondInit$).toBe(firstInit$);
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0]).toBeInstanceOf(ClientToBffContextInitMessage);

    const firstValues: boolean[] = [];
    const firstSubscription = firstInit$.subscribe((value) =>
      firstValues.push(value),
    );
    expect(firstValues).toEqual([]);

    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, { value: 1 }),
    );

    expect(firstValues).toEqual([true]);

    sentMessages.length = 0;

    const lateValues: boolean[] = [];
    const lateSubscription = service
      .init$(contextId)
      .subscribe((value) => lateValues.push(value));

    expect(lateValues).toEqual([true]);
    expect(sentMessages).toHaveLength(0);

    firstSubscription.unsubscribe();
    lateSubscription.unsubscribe();
    sentSub.unsubscribe();
  });

  it('очистка SSR-задачи после инициализации', () => {
    const contextId = 'ctx-ssr-cleanup';

    service.init$(contextId);

    expect(ssr.addTask).toHaveBeenCalledTimes(1);

    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, { foo: 'bar' }),
    );

    const cleanupHandler = ssr.addTask.mock.results[0].value;
    expect(ssr.cleanupTask).toHaveBeenCalledTimes(1);
    expect(ssr.cleanupTask).toHaveBeenCalledWith(cleanupHandler);
  });

  it('отправка только изменённых значений', () => {
    const contextId = 'ctx-partial-update';

    const sentMessages: ClientToBffMessage[] = [];
    const sentSub = postman.outcomingMessage$.subscribe((msg) =>
      sentMessages.push(msg),
    );

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, {
        field: 1,
        nested: { value: 2 },
      }),
    );

    sentMessages.length = 0;

    const changeEvents: ContextChangeEvent[] = [];
    const changeSub = service.change$.subscribe((event) =>
      changeEvents.push(event),
    );

    service.setValues(contextId, [
      { key: 'field', value: 1 },
      { key: 'nested.value', value: 3 },
    ]);

    expect(service.value('ctx-partial-update.nested.value')).toBe(3);
    expect(changeEvents).toEqual([
      { contextId, values: [{ key: 'nested.value', value: 3 }] },
    ]);

    expect(sentMessages).toHaveLength(1);
    const partialUpdateMessage =
      sentMessages[0] as ClientToBffContextValuesMessage;
    expect(partialUpdateMessage).toBeInstanceOf(
      ClientToBffContextValuesMessage,
    );
    expect(partialUpdateMessage.target).toBe(contextId);
    expect(partialUpdateMessage.payload).toEqual([
      { key: 'nested.value', value: 3 },
    ]);

    changeSub.unsubscribe();
    sentSub.unsubscribe();
  });

  it('рекурсивная подстановка плейсхолдеров', () => {
    const contextId = 'ctx-recursive-placeholders';

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, {
        finalValue: 'resolved',
        secondLevel: '@{ctx-recursive-placeholders.finalValue}',
        firstLevel: '@{ctx-recursive-placeholders.secondLevel}',
      }),
    );

    const replaced = service.replacePlaceholders(
      'Start @{ctx-recursive-placeholders.firstLevel} end',
    );
    expect(replaced).toBe('Start resolved end');

    const firstLevelValue = service.value(
      'ctx-recursive-placeholders.firstLevel',
    );
    const resolvedValue = service.replacePlaceholders(String(firstLevelValue));
    expect(resolvedValue).toBe('resolved');
  });

  it('литерал по умолчанию для плейсхолдера', () => {
    const contextId = 'ctx-default-literal';

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, {
        existing: 'value',
      }),
    );

    const result = service.replacePlaceholders(
      `prefix @{${contextId}.missingKey=fallback literal} suffix`,
    );

    expect(result).toBe('prefix fallback literal suffix');
  });

  it('удаление контекста по сообщению с сервера', () => {
    const contextId = 'ctx-destroy';

    service.init$(contextId);
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, { field: 1 }),
    );

    expect(service.loaded(contextId)).toBe(true);

    postman.incomingMessage$.next(new ContextDestroyMessage(contextId));

    expect(service.loaded(contextId)).toBe(false);
  });

  describe('отложенное уничтожение (holds)', () => {
    it('context-destroy при holdCount > 0 оставляет snapshot', () => {
      const contextId = 'ctx-pending';

      service.init$(contextId);
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, { field: 'x' }),
      );
      service.retain(contextId);

      postman.incomingMessage$.next(new ContextDestroyMessage(contextId));

      expect(service.loaded(contextId)).toBe(true);
      expect(service.isPendingDestroy(contextId)).toBe(true);
      expect(service.value(`${contextId}.field`)).toBe('x');
    });

    it('release после pending evict контекст', () => {
      const contextId = 'ctx-pending-release';

      service.init$(contextId);
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, { n: 1 }),
      );
      service.retain(contextId);
      postman.incomingMessage$.next(new ContextDestroyMessage(contextId));

      service.release(contextId);

      expect(service.loaded(contextId)).toBe(false);
    });

    it('setValues на pending не шлёт context-values на BFF', () => {
      const contextId = 'ctx-pending-sync';
      const sentMessages: ClientToBffMessage[] = [];
      const sub = postman.outcomingMessage$.subscribe((msg) =>
        sentMessages.push(msg),
      );

      service.init$(contextId);
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, { field: 0 }),
      );
      service.retain(contextId);
      postman.incomingMessage$.next(new ContextDestroyMessage(contextId));

      const before = sentMessages.length;
      service.setValues(contextId, [{ key: 'field', value: 1 }]);

      const outValues = sentMessages
        .slice(before)
        .filter((m) => m instanceof ClientToBffContextValuesMessage);
      expect(outValues).toHaveLength(0);
      expect(service.value(`${contextId}.field`)).toBe(1);

      sub.unsubscribe();
    });

    it('context-init снимает pending и заменяет values', () => {
      const contextId = 'ctx-reinit';

      service.init$(contextId);
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, { field: 'old' }),
      );
      service.retain(contextId);
      postman.incomingMessage$.next(new ContextDestroyMessage(contextId));

      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, { field: 'new' }),
      );

      expect(service.isPendingDestroy(contextId)).toBe(false);
      expect(service.value(`${contextId}.field`)).toBe('new');
    });

    it('init$ для pending не шлёт ContextInitMessage на BFF', () => {
      const contextId = 'ctx-pending-init';
      const sentMessages: ClientToBffMessage[] = [];
      const sub = postman.outcomingMessage$.subscribe((msg) =>
        sentMessages.push(msg),
      );

      service.init$(contextId);
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, { ok: true }),
      );
      service.retain(contextId);
      postman.incomingMessage$.next(new ContextDestroyMessage(contextId));

      const before = sentMessages.length;
      service.init$(contextId).subscribe();

      const initRequests = sentMessages
        .slice(before)
        .filter((m) => m instanceof ClientToBffContextInitMessage);
      expect(initRequests).toHaveLength(0);

      sub.unsubscribe();
    });
  });
});
