import { inject, Injectable } from '@angular/core';
import {
  ContextDestroyMessage,
  ContextValuesMessage,
} from '@shared/messages/bff-to-client/context';
import { ContextInitMessage as BffToClientContextInitMessage } from '@shared/messages/bff-to-client/context/context-init-message';
import { ContextInitMessage as ClientToBffContextInitMessage } from '@shared/messages/client-to-bff/context/context-init-message';
import { ContextValuesMessage as ClientToBffContextValuesMessage } from '@shared/messages/client-to-bff/context/context-values-message';
import { fetchFromObject } from '@shared/utils/fetch-from-object';
import {
  BehaviorSubject,
  filter,
  map,
  ReplaySubject,
  Subject,
  Subscription,
} from 'rxjs';
import { ContextChangeEvent } from '../types/context-change-event';
import { findContextKeys } from '../utils/find-context-keys';
import { objectSetValue } from '../utils/object-set-value';
import { parseContextPath } from '../utils/parse-context-path';
import { PostmanService } from './postman.service';
import { SsrService } from './ssr.service';

export class ContextNotLoadedError extends Error {
  constructor(
    readonly contextId: string,
    readonly key: string,
  ) {
    super(
      `Trying to access context ${contextId} which is not loaded. Key: ${key}`,
    );
    this.name = 'ContextNotLoadedError';
  }
}

class Context {
  values$!: BehaviorSubject<object>;
  private readonly _change$ = new Subject<{ key: string; value: unknown }[]>();
  private postman!: PostmanService;
  private id!: string;
  private needSync = true;
  private subscription?: Subscription;

  init(postman: PostmanService, id: string, values: object) {
    this.postman = postman;
    this.id = id;
    this.values$ = new BehaviorSubject<object>(values);
    this.subscription = this.postman.incomingMessage$
      .pipe(
        filter(
          (message): message is ContextValuesMessage =>
            message instanceof ContextValuesMessage &&
            message.target === this.id,
        ),
        map((message) => message.payload),
      )
      .subscribe((payload) => {
        this.needSync = false;
        this.setValues(payload);
        this.needSync = true;
      });

    return this;
  }

  destroy() {
    this.subscription?.unsubscribe();
    this.values$?.complete();
  }

  change$() {
    return this._change$;
  }

  private emitChange(values: { key: string; value: unknown }[]) {
    this._change$.next(values);
  }

  value(key: string): unknown {
    return fetchFromObject(this.values$.getValue(), key);
  }

  setValues(data: { key: string; value: unknown }[]) {
    const values = this.values$.getValue();
    const changes: { key: string; value: unknown }[] = [];
    data.forEach((item) => {
      if (fetchFromObject(values, item.key) !== item.value) {
        changes.push(item);
      }
    });
    changes.forEach((item) => {
      objectSetValue(values, item.key, item.value);
    });
    if (this.needSync && changes.length > 0) {
      this.postman.outcomingMessage$.next(
        new ClientToBffContextValuesMessage(this.id, changes),
      );
    }
    this.values$.next(values);
    if (changes.length > 0) {
      this.emitChange(changes);
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class ContextHubService {
  private contextMap: Map<string, Context> = new Map();
  private postman = inject(PostmanService);
  private readonly changeSubject = new Subject<ContextChangeEvent>();
  readonly change$ = this.changeSubject.asObservable();
  private contextInitMap = new Map<string, ReplaySubject<true>>();
  ssr = inject(SsrService);

  constructor() {
    this.postman.incomingMessage$
      .pipe(
        filter(
          (message): message is BffToClientContextInitMessage =>
            message instanceof BffToClientContextInitMessage,
        ),
      )
      .subscribe((message: BffToClientContextInitMessage) => {
        const contextId = message.target;
        const values = message.payload;
        const subject =
          this.contextInitMap.get(contextId) || new ReplaySubject<true>(1);
        if (!this.contextInitMap.has(contextId)) {
          this.contextInitMap.set(contextId, subject);
        }
        const previousContext = this.contextMap.get(contextId);
        previousContext?.destroy();

        const context = new Context().init(this.postman, contextId, values);
        context.change$().subscribe((values) => {
          this.changeSubject.next({ contextId, values });
        });
        this.contextMap.set(contextId, context);
        // Инициализация не проходит через setValues → подписчики change$ (инпуты) иначе
        // не подхватывают значения, если смонтировались в том же цикле, что и ContextInit.
        this.changeSubject.next({ contextId, values: [] });
        subject.next(true);
      });

    this.postman.incomingMessage$
      .pipe(
        filter(
          (message): message is ContextDestroyMessage =>
            message instanceof ContextDestroyMessage,
        ),
      )
      .subscribe((message) => {
        this.removeContext(message.target);
      });
  }

  private removeContext(contextId: string) {
    this.contextMap.get(contextId)?.destroy();
    this.contextMap.delete(contextId);
    this.contextInitMap.delete(contextId);
  }
  /** Отслеживание инициализации контекста чтобы рендерить компоненты */
  init$(contextId: string): ReplaySubject<true> {
    const subject =
      this.contextInitMap.get(contextId) || new ReplaySubject<true>(1);
    if (!this.contextInitMap.has(contextId)) {
      const initContextTask = this.ssr.addTask();
      this.contextInitMap.set(contextId, subject);
      // Запрос значений контекста с сервера
      subject.subscribe(() => {
        this.ssr.cleanupTask(initContextTask);
      });
      this.postman.outcomingMessage$.next(
        new ClientToBffContextInitMessage(contextId, {}),
      );
    }
    return subject;
  }

  setValues(contextId: string, data: { key: string; value: unknown }[]) {
    this.contextMap.get(contextId)!.setValues(data);
  }

  value(path: string): unknown {
    path = this.replacePlaceholders(path);
    const pathInfo = parseContextPath(path);
    const context = this.contextMap.get(pathInfo.contextId);
    if (!context) {
      throw new ContextNotLoadedError(pathInfo.contextId, pathInfo.key);
    }
    return context.value(pathInfo.key);
  }

  loaded(contextId: string) {
    return this.contextMap.get(contextId) !== undefined;
  }

  replacePlaceholders(str: string): string {
    const contextKeys = findContextKeys(str);
    for (const rule of contextKeys) {
      const [path, defaultValue = ''] = rule.split('='); // Может быть значение по умолчанию, например @{name=Иван}
      const value = this.value(path);
      const replacement = value ?? defaultValue;
      str = str.replaceAll(`@{${rule}}`, String(replacement));
    }
    const restContextKeys = findContextKeys(str);
    if (restContextKeys.length) {
      // После замены появились новые замены
      return this.replacePlaceholders(str);
    }
    return str;
  }
}
