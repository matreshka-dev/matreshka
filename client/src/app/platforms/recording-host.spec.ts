import { MediaKind } from '@matreshka/client-bff-protocol/enums/media-kind';
import { RecordingCreateMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-create-message';
import { RecordingStartMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-start-message';
import { RecordingStopMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-stop-message';
import { ActionCompletedMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/action-completed-message';
import { RecordingStopSuccessMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/platforms/recording-stop-success-message';
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClientMediaStreamHost } from './media-stream-host';
import { ClientRecordingHost } from './recording-host';

describe('ClientRecordingHost', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('create requires existing streams, start/stop yield blob url', async () => {
    const track = {
      kind: 'audio',
      stop: vi.fn(),
    };
    const mediaStream = {
      getTracks: () => [track],
      getVideoTracks: () => [],
      getAudioTracks: () => [track],
    };
    const streamHost = {
      getStream: vi.fn((id: string) =>
        id === 'media-stream-1' ? mediaStream : undefined,
      ),
    } as unknown as ClientMediaStreamHost;

    const listeners = new Map<string, EventListener>();
    const recorder = {
      state: 'inactive' as string,
      mimeType: 'audio/webm',
      ondataavailable: null as ((event: { data: Blob }) => void) | null,
      onerror: null as (() => void) | null,
      start: vi.fn(function (this: typeof recorder) {
        this.state = 'recording';
      }),
      stop: vi.fn(function (this: typeof recorder) {
        this.state = 'inactive';
        this.ondataavailable?.({
          data: new Blob(['x'], { type: 'audio/webm' }),
        });
        listeners.get('stop')?.(new Event('stop'));
      }),
      pause: vi.fn(),
      resume: vi.fn(),
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      removeEventListener: vi.fn((type: string) => {
        listeners.delete(type);
      }),
    };

    class FakeMediaRecorder {
      static isTypeSupported(): boolean {
        return true;
      }
      constructor() {
        return recorder;
      }
    }
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    vi.stubGlobal(
      'MediaStream',
      class {
        constructor(public tracks: unknown[]) {}
        getTracks() {
          return this.tracks;
        }
        getVideoTracks() {
          return [];
        }
        getAudioTracks() {
          return this.tracks;
        }
      },
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:recording'),
      revokeObjectURL: vi.fn(),
    });

    const outcomingMessage$ = new Subject();
    const next = vi.fn();
    outcomingMessage$.subscribe(next);

    const host = new ClientRecordingHost(
      { outcomingMessage$ } as never,
      streamHost,
      { init$: () => new Subject() } as never,
      {
        getInstancesByComponentId: () => [],
        conditionsMet: () => true,
      } as never,
      {} as never,
    );

    host.handle(
      new RecordingCreateMessage('platform-action-1', {
        recordingId: 'recording-1',
        streamIds: ['media-stream-1'],
        interactions: {},
      }),
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled());
    expect(next.mock.calls[0][0]).toBeInstanceOf(ActionCompletedMessage);
    next.mockClear();

    host.handle(
      new RecordingStartMessage('platform-action-2', {
        recordingId: 'recording-1',
      }),
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled());
    expect(recorder.start).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(ActionCompletedMessage);
    next.mockClear();

    host.handle(
      new RecordingStopMessage('platform-action-3', {
        recordingId: 'recording-1',
      }),
    );
    await vi.waitFor(() => expect(next).toHaveBeenCalled());
    expect(next.mock.calls[0][0]).toBeInstanceOf(RecordingStopSuccessMessage);
    const success = next.mock.calls[0][0] as RecordingStopSuccessMessage;
    expect(success.payload.url).toBe('blob:recording');
    expect(success.payload.kind).toBe(MediaKind.Audio);
    expect(success.payload.size).toBeGreaterThan(0);
  });
});
