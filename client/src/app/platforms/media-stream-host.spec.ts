import { MediaKind } from '@matreshka/client-bff-protocol/enums/media-kind';
import { PlatformGetUserMediaMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/platform-get-user-media-message';
import { PlatformMediaStreamStopMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/platform-media-stream-stop-message';
import { ActionCompletedMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/action-completed-message';
import { ErrorMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/error-message';
import { PlatformMediaStreamSuccessMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/platforms/platform-media-stream-success-message';
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientMediaStreamHost } from './media-stream-host';

describe('ClientMediaStreamHost', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getUserMedia stores stream and posts success', async () => {
    const track = {
      kind: 'audio',
      label: 'Mic',
      stop: vi.fn(),
      getSettings: () => ({ deviceId: 'dev-1' }),
    };
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [],
      getAudioTracks: () => [track],
    };
    const getUserMedia = vi.fn(async () => stream);
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia },
    });

    const outcomingMessage$ = new Subject();
    const next = vi.fn();
    outcomingMessage$.subscribe(next);
    const host = new ClientMediaStreamHost({
      outcomingMessage$,
    } as never);

    host.handle(
      new PlatformGetUserMediaMessage('platform-action-1', {
        streamId: 'media-stream-1',
        constraints: { audio: true },
      }),
    );

    await vi.waitFor(() => expect(next).toHaveBeenCalled());
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(host.getStream('media-stream-1')).toBe(stream);
    expect(next.mock.calls[0][0]).toBeInstanceOf(
      PlatformMediaStreamSuccessMessage,
    );
    const success = next.mock.calls[0][0] as PlatformMediaStreamSuccessMessage;
    expect(success.payload).toEqual({
      streamId: 'media-stream-1',
      tracks: [
        {
          kind: MediaKind.Audio,
          label: 'Mic',
          settings: { deviceId: 'dev-1' },
        },
      ],
    });
  });

  it('stop ends tracks and acks', async () => {
    const track = {
      kind: 'audio',
      label: '',
      stop: vi.fn(),
      getSettings: () => ({}),
    };
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [],
      getAudioTracks: () => [track],
    };
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => stream),
      },
    });

    const outcomingMessage$ = new Subject();
    const next = vi.fn();
    outcomingMessage$.subscribe(next);
    const host = new ClientMediaStreamHost({
      outcomingMessage$,
    } as never);

    host.handle(
      new PlatformGetUserMediaMessage('platform-action-1', {
        streamId: 'media-stream-1',
        constraints: { audio: true },
      }),
    );
    await vi.waitFor(() =>
      expect(host.getStream('media-stream-1')).toBeTruthy(),
    );
    next.mockClear();

    host.handle(
      new PlatformMediaStreamStopMessage('platform-action-2', {
        streamId: 'media-stream-1',
      }),
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled());
    expect(track.stop).toHaveBeenCalled();
    expect(host.getStream('media-stream-1')).toBeUndefined();
    expect(next.mock.calls[0][0]).toBeInstanceOf(ActionCompletedMessage);
  });

  it('getUserMedia posts ErrorMessage on failure', async () => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => {
          throw new Error('denied');
        }),
      },
    });

    const outcomingMessage$ = new Subject();
    const next = vi.fn();
    outcomingMessage$.subscribe(next);
    const host = new ClientMediaStreamHost({
      outcomingMessage$,
    } as never);

    host.handle(
      new PlatformGetUserMediaMessage('platform-action-1', {
        streamId: 'media-stream-1',
        constraints: { audio: true },
      }),
    );

    await vi.waitFor(() => expect(next).toHaveBeenCalled());
    expect(next.mock.calls[0][0]).toBeInstanceOf(ErrorMessage);
    expect((next.mock.calls[0][0] as ErrorMessage).payload.message).toBe(
      'denied',
    );
  });
});
