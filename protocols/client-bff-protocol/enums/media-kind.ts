/**
 * Вид медиа: трек `MediaStreamTrack`, `HTMLMediaElement` или результат записи.
 * Строки совпадают с Web API (`track.kind`, тег audio/video).
 */
export enum MediaKind {
  Audio = "audio",
  Video = "video",
}
