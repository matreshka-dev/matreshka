import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WEB_SOCKET } from '../tokens/web-socket';
import { WebsocketSource } from './websocket-source';

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  readyState = FakeWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  readonly url: string;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(): void {}

  close(code = 1000): void {
    this.completeClose(code);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.({} as Event);
  }

  /** Сервер закрыл уже открытое соединение */
  remoteClose(code: number): void {
    this.completeClose(code);
  }

  /** Handshake не удался — onopen не вызывался */
  failHandshake(code = 1006): void {
    this.onerror?.({} as Event);
    this.completeClose(code);
  }

  private completeClose(code: number): void {
    if (this.readyState === FakeWebSocket.CLOSED) {
      return;
    }
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code } as CloseEvent);
  }
}

describe('WebsocketSource', () => {
  let source: WebsocketSource;

  beforeEach(() => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WEB_SOCKET,
          useValue: FakeWebSocket,
        },
      ],
    });
    source = TestBed.runInInjectionContext(
      () => new WebsocketSource({ url: 'ws://test' }),
    );
  });

  afterEach(() => {
    source.disconnect();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  function connectAndOpen(): FakeWebSocket {
    source.connect();
    const socket = FakeWebSocket.instances.at(-1)!;
    socket.open();
    return socket;
  }

  it('переподключается, если сервер закрыл соединение с кодом 1000 (рестарт процесса)', () => {
    const first = connectAndOpen();
    expect(source.connected()).toBe(true);

    first.remoteClose(1000);
    vi.advanceTimersByTime(0);

    expect(source.connected()).toBe(false);
    expect(FakeWebSocket.instances).toHaveLength(2);

    FakeWebSocket.instances[1].open();
    expect(source.connected()).toBe(true);
  });

  it('продолжает retry, если первая попытка реконнекта не открылась', () => {
    const first = connectAndOpen();
    first.remoteClose(1006);
    vi.advanceTimersByTime(0);

    expect(FakeWebSocket.instances).toHaveLength(2);
    FakeWebSocket.instances[1].failHandshake(1006);

    vi.advanceTimersByTime(500);
    expect(FakeWebSocket.instances).toHaveLength(3);

    FakeWebSocket.instances[2].open();
    expect(source.connected()).toBe(true);
  });

  it('не переподключается после штатного disconnect()', () => {
    connectAndOpen();
    source.disconnect();
    vi.advanceTimersByTime(1000);

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(source.connected()).toBe(false);
  });

  it('не переподключается в фоне, пока вкладка скрыта', () => {
    const first = connectAndOpen();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });

    first.remoteClose(1006);
    vi.advanceTimersByTime(1000);

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(source.connected()).toBe(false);
  });
});
