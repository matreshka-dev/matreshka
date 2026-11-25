import { MediaTrackKind } from '@matreshka/client-bff-protocol/enums/media-track-kind';
import type { AnyBffToClientMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/bff-to-client-message';
import { PlatformGetDisplayMediaMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/platform-get-display-media-message';
import { PlatformGetUserMediaMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/platform-get-user-media-message';
import { PlatformMediaStreamStopMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/platform-media-stream-stop-message';
import {
  PlatformMediaStreamSuccessMessage,
  type PlatformMediaStreamTrackInfo,
} from '@matreshka/client-bff-protocol/messages/client-to-bff/platforms/platform-media-stream-success-message';
import { PostmanService } from '../services/postman.service';
import {
  completeTargetedAction,
  failTargetedAction,
} from '../utils/targeted-action';

/**
 * Реестр живых `MediaStream` на клиенте (getUserMedia / getDisplayMedia).
 */
export class ClientMediaStreamHost {
  private readonly streams = new Map<string, MediaStream>();

  constructor(private readonly postman: PostmanService) {}

  handle(message: AnyBffToClientMessage): boolean {
    if (message instanceof PlatformGetUserMediaMessage) {
      void this.getUserMedia(message);
      return true;
    }
    if (message instanceof PlatformGetDisplayMediaMessage) {
      void this.getDisplayMedia(message);
      return true;
    }
    if (message instanceof PlatformMediaStreamStopMessage) {
      void this.stop(message);
      return true;
    }
    return false;
  }

  getStream(streamId: string): MediaStream | undefined {
    return this.streams.get(streamId);
  }

  private async getUserMedia(
    message: PlatformGetUserMediaMessage,
  ): Promise<void> {
    const { streamId, constraints } = message.payload;
    try {
      this.assertNew(streamId);
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints ?? {},
      );
      this.streams.set(streamId, stream);
      this.sendSuccess(message.target, streamId, stream);
    } catch (error) {
      this.destroyStream(streamId);
      failTargetedAction(this.postman, message.target, error);
    }
  }

  private async getDisplayMedia(
    message: PlatformGetDisplayMediaMessage,
  ): Promise<void> {
    const { streamId, options } = message.payload;
    try {
      this.assertNew(streamId);
      const stream = await navigator.mediaDevices.getDisplayMedia(
        options ?? { video: true },
      );
      this.streams.set(streamId, stream);
      this.sendSuccess(message.target, streamId, stream);
    } catch (error) {
      this.destroyStream(streamId);
      failTargetedAction(this.postman, message.target, error);
    }
  }

  private async stop(message: PlatformMediaStreamStopMessage): Promise<void> {
    try {
      const stream = this.streams.get(message.payload.streamId);
      if (!stream) {
        throw new Error(`MediaStream ${message.payload.streamId} not found`);
      }
      this.destroyStream(message.payload.streamId);
      completeTargetedAction(this.postman, message.target);
    } catch (error) {
      failTargetedAction(this.postman, message.target, error);
    }
  }

  private sendSuccess(
    target: string,
    streamId: string,
    stream: MediaStream,
  ): void {
    this.postman.outcomingMessage$.next(
      new PlatformMediaStreamSuccessMessage(target, {
        streamId,
        tracks: stream.getTracks().map(toTrackInfo),
      }),
    );
  }

  private assertNew(streamId: string): void {
    if (this.streams.has(streamId)) {
      throw new Error(`MediaStream ${streamId} already exists`);
    }
  }

  private destroyStream(streamId: string): void {
    const stream = this.streams.get(streamId);
    if (!stream) {
      return;
    }
    stream.getTracks().forEach((track) => track.stop());
    this.streams.delete(streamId);
  }
}

function toTrackInfo(track: MediaStreamTrack): PlatformMediaStreamTrackInfo {
  let settings: Record<string, unknown> | undefined;
  try {
    settings = track.getSettings() as Record<string, unknown>;
  } catch {
    settings = undefined;
  }
  return {
    kind: track.kind === 'video' ? MediaTrackKind.Video : MediaTrackKind.Audio,
    label: track.label || undefined,
    settings,
  };
}
