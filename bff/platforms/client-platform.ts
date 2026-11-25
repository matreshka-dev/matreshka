import type {
  DisplayMediaStreamOptions,
  MediaStreamConstraints,
} from "@matreshka/client-bff-protocol/types/media-stream-constraints";
import { map, Observable } from "rxjs";
import { Audio, MediaConfig, Video } from "./media";
import { MediaStreamRef } from "./media-stream-ref";
import { Platform } from "./platform";
import { Recording, type RecordingConfig } from "./recording";

/**
 * Абстрактный класс, реализующий любую клиентскую платформу.
 */
export abstract class ClientPlatform extends Platform {
  /**
   * Создаёт `HTMLAudioElement` на клиенте вне DOM.
   * Hot: элемент создаётся при вызове. Observable эмитит объект после ack.
   */
  createAudio(config: MediaConfig = {}): Observable<Audio> {
    const audio = new Audio(this.client, config);
    return audio.open().pipe(map(() => audio));
  }

  /**
   * Создаёт `HTMLVideoElement` на клиенте вне DOM.
   * `Video.id` — ключ реестра, который позже сможет забрать видеокомпонент.
   */
  createVideo(config: MediaConfig = {}): Observable<Video> {
    const video = new Video(this.client, config);
    return video.open().pipe(map(() => video));
  }

  /**
   * Запрашивает `MediaStream` через `navigator.mediaDevices.getUserMedia`.
   * Поток живёт на клиенте; BFF получает {@link MediaStreamRef}.
   */
  getUserMedia(
    constraints?: MediaStreamConstraints,
  ): Observable<MediaStreamRef> {
    const stream = new MediaStreamRef(this.client);
    return stream.openUserMedia(constraints);
  }

  /**
   * Запрашивает захват экрана через `navigator.mediaDevices.getDisplayMedia`.
   */
  getDisplayMedia(
    options?: DisplayMediaStreamOptions,
  ): Observable<MediaStreamRef> {
    const stream = new MediaStreamRef(this.client);
    return stream.openDisplayMedia(options);
  }

  /**
   * Создаёт сессию `MediaRecorder` на клиенте поверх одного или нескольких потоков.
   */
  createRecording(config: RecordingConfig): Observable<Recording> {
    const recording = new Recording(this.client, config);
    return recording.open().pipe(map(() => recording));
  }
}
