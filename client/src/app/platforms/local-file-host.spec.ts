import { LocalFileDestroyMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/local-file-destroy-message';
import { LocalFileUploadAbortMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/local-file-upload-abort-message';
import { LocalFileUploadMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/local-file-upload-message';
import { ActionCompletedMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/action-completed-message';
import { LocalFileUploadProgressMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/platforms/local-file-upload-progress-message';
import { LocalFileUploadSuccessMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/platforms/local-file-upload-success-message';
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientLocalFileHost } from './local-file-host';

describe('ClientLocalFileHost', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('register / destroy revoke object URL', () => {
    const outcomingMessage$ = new Subject();
    const next = vi.fn();
    outcomingMessage$.subscribe(next);
    const revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(),
      revokeObjectURL: revoke,
    });

    const host = new ClientLocalFileHost({ outcomingMessage$ } as never);
    host.register('file-1', new Blob(['x']), 'blob:file-1', 'a.txt');
    expect(host.get('file-1')?.name).toBe('a.txt');

    host.handle(
      new LocalFileDestroyMessage('platform-action-1', { fileId: 'file-1' }),
    );
    expect(revoke).toHaveBeenCalledWith('blob:file-1');
    expect(host.get('file-1')).toBeUndefined();
    expect(next.mock.calls[0][0]).toBeInstanceOf(ActionCompletedMessage);
  });

  it('upload sends progress and success, abort cancels xhr', () => {
    const outcomingMessage$ = new Subject();
    const next = vi.fn();
    outcomingMessage$.subscribe(next);

    let uploadedProgress: ((event: ProgressEvent) => void) | null = null;
    let onload: (() => void) | null = null;
    let onabort: (() => void) | null = null;
    const abort = vi.fn(() => {
      onabort?.();
    });
    const send = vi.fn();
    const open = vi.fn();
    const setRequestHeader = vi.fn();

    class FakeXHR {
      status = 200;
      responseText = '{"id":1}';
      upload = {
        set onprogress(handler: (event: ProgressEvent) => void) {
          uploadedProgress = handler;
        },
      };
      set onload(handler: () => void) {
        onload = handler;
      }
      set onerror(_handler: () => void) {}
      set onabort(handler: () => void) {
        onabort = handler;
      }
      open = open;
      setRequestHeader = setRequestHeader;
      send = send;
      abort = abort;
    }
    vi.stubGlobal('XMLHttpRequest', FakeXHR);

    const host = new ClientLocalFileHost({ outcomingMessage$ } as never);
    host.register('file-1', new Blob(['x']), 'blob:file-1', 'a.txt');

    host.handle(
      new LocalFileUploadMessage('platform-action-upload', {
        fileId: 'file-1',
        url: '/upload',
        headers: { 'X-Test': '1' },
        fields: { ticket: 't' },
      }),
    );

    expect(open).toHaveBeenCalledWith('POST', '/upload');
    expect(setRequestHeader).toHaveBeenCalledWith('X-Test', '1');
    expect(send).toHaveBeenCalled();

    uploadedProgress?.({
      lengthComputable: true,
      loaded: 50,
      total: 100,
    });
    expect(next.mock.calls[0][0]).toBeInstanceOf(
      LocalFileUploadProgressMessage,
    );
    expect(
      (next.mock.calls[0][0] as LocalFileUploadProgressMessage).payload
        .progress,
    ).toBe(50);

    onload?.();
    expect(next.mock.calls[1][0]).toBeInstanceOf(LocalFileUploadSuccessMessage);
    expect(
      (next.mock.calls[1][0] as LocalFileUploadSuccessMessage).payload.response,
    ).toEqual({ id: 1 });
    expect(next.mock.calls[2][0]).toBeInstanceOf(ActionCompletedMessage);

    next.mockClear();
    host.handle(
      new LocalFileUploadMessage('platform-action-upload-2', {
        fileId: 'file-1',
        url: '/upload',
      }),
    );
    host.handle(new LocalFileUploadAbortMessage('platform-action-upload-2'));
    expect(abort).toHaveBeenCalled();
  });
});
