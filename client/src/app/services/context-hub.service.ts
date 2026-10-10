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
import { ContextHoldRegistry } from './context-hold-registry';
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
  /** BFF уже уничтожил контекст; на клиенте остаётся snapshot до evict. */
  private pendingDestroy = false;
  /** Исходящий context-values на BFF (выключается при pendingDestroy). */
  private syncToBff = true;

  init(postman: PostmanService, id: string, values: object) {
    this.postman = postman;
    this.id = id;
    this.values$ = new BehaviorSubject<object>(values);
    this.pendingDestroy = false;
    this.syncToBff = true;
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

  isPendingDestroy() {
    return this.pendingDestroy;
  }

  /** После context-destroy с BFF: только чтение snapshot, без sync на сервер. */
  markPendingDestroyFromServer() {
    this.pendingDestroy = true;
    this.syncToBff = false;
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
    if (this.needSync && this.syncToBff && changes.length > 0) {
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
  private readonly holdRegistry = new ContextHoldRegistry();
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
        this.applyContextInit(message.target, message.payload);
      });

    this.postman.incomingMessage$
      .pipe(
        filter(
          (message): message is ContextDestroyMessage =>
            message instanceof ContextDestroyMessage,
        ),
      )
      .subscribe((message) => {
        this.requestDestroyFromServer(message.target);
      });
  }

  private applyContextInit(contextId: string, values: object) {
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
  }

  /**
   * BFF сообщил context-destroy: сразу evict, если нет holds;
   * иначе помечаем pending и держим snapshot для UI.
   */
  requestDestroyFromServer(contextId: string) {
    const context = this.contextMap.get(contextId);
    if (!context) {
      return;
    }
    if (this.holdRegistry.holdCount(contextId) > 0) {
      context.markPendingDestroyFromServer();
      return;
    }
    this.evictContext(contextId);
  }

  /** Физически удалить контекст из hub (после evict или когда holds = 0). */
  private evictContext(contextId: string) {
    this.contextMap.get(contextId)?.destroy();
    this.contextMap.delete(contextId);
    this.contextInitMap.delete(contextId);
  }

  /** После release: если сервер уже уничтожил id и holds не осталось — evict. */
  private tryEvictAfterRelease(contextId: string) {
    const context = this.contextMap.get(contextId);
    if (context?.isPendingDestroy()) {
      this.evictContext(contextId);
    }
  }

  /**
   * Удержание contextId узлом config store (ref / rules / плейсхолдеры).
   * @internal вызывается из ComponentHubService.
   */
  retain(contextId: string): void {
    this.holdRegistry.retain(contextId);
  }

  /**
   * Снятие удержания; при holdCount → 0 и pendingDestroy — evict snapshot.
   * @internal вызывается из ComponentHubService.
   */
  release(contextId: string): void {
    const remaining = this.holdRegistry.release(contextId);
    if (remaining === 0) {
      this.tryEvictAfterRelease(contextId);
    }
  }

  /** @internal для тестов */
  holdCount(contextId: string): number {
    return this.holdRegistry.holdCount(contextId);
  }

  /** Сервер уничтожил контекст, на клиенте ещё жив snapshot (есть holds). */
  isPendingDestroy(contextId: string): boolean {
    return this.contextMap.get(contextId)?.isPendingDestroy() ?? false;
  }

  /** Отслеживание инициализации контекста чтобы рендерить компоненты */
  init$(contextId: string): ReplaySubject<true> {
    const pendingSnapshot = this.contextMap.get(contextId);
    if (pendingSnapshot?.isPendingDestroy()) {
      let subject = this.contextInitMap.get(contextId);
      if (!subject) {
        subject = new ReplaySubject<true>(1);
        this.contextInitMap.set(contextId, subject);
      }
      // На BFF контекста уже нет — не шлём ContextInitMessage, snapshot достаточен для ready$.
      subject.next(true);
      return subject;
    }

    const subject =
      this.contextInitMap.get(contextId) || new ReplaySubject<true>(1);
    if (!this.contextInitMap.has(contextId)) {
      const initContextTask = this.ssr.addTask();
      this.contextInitMap.set(contextId, subject);
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

  /** true, если контекст в map (включая pendingDestroy snapshot). */
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
