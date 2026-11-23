import { map, Observable } from "rxjs";
import { Audio, MediaConfig, Video } from "./media";
import { Platform } from "./platform";

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
}
