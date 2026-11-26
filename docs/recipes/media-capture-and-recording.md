# Захват и запись медиа

Как на BFF записывать голос, камеру и экран, выбирать устройство в UI и
проигрывать результат через `createAudio` / `createVideo`.

API живёт на `ClientPlatform`: `getUserMedia`, `getDisplayMedia`,
`createRecording`. Краткий контракт — в
[platforms.md](../reference/platforms.md#захват-и-запись-медиа). Семантика
platform-action — в
[platform-actions.md](../architecture/platform-actions.md).

`currentClientPlatform()` возвращает базовый `Platform`, поэтому перед вызовом
нужна проверка `instanceof ClientPlatform`.

---

## Модель в двух словах

```text
getUserMedia / getDisplayMedia  →  MediaStreamRef (поток на клиенте)
                ↓
         createRecording({ streams })
                ↓
    start / pause / resume / stop
                ↓
     LocalFile (blob на клиенте, url = blob:…)
                ↓
    createAudio / createVideo / file.upload / file.save
```

- Поток (`MediaStream`) **не** уезжает на BFF — только `MediaStreamRef` с `id` и
  метаданными треков.
- После `recording.stop()` треки **не** останавливаются сами: вызовите
  `stream.stop()`, когда поток больше не нужен. Blob результата принадлежит
  `LocalFile`; освобождайте через `file.destroy()`.
- `getDisplayMedia` и первый `getUserMedia` зависят от permission и user
  gesture — вызывайте из UI-действия пользователя.

---

## 1. Голосовое сообщение в чате

Задача: по кнопке записать голос с дефолтного микрофона, остановить, прослушать
локально и при необходимости загрузить через `LocalFile.upload`.

```ts
import { button, createContext, Page, text } from "@matreshka/bff";
import { when } from "@matreshka/bff/core/conditions";
import {
  ClientPlatform,
  currentClientPlatform,
  LocalFile,
  type MediaStreamRef,
  type Recording,
} from "@matreshka/bff/platforms";
import { firstValueFrom } from "rxjs";
import { z } from "zod";

type VoiceChatState = {
  status: "idle" | "recording" | "ready" | "error";
  duration: number;
  error?: string;
  previewUrl?: string;
};

export class VoiceChatPage extends Page {
  private mic?: MediaStreamRef;
  private recording?: Recording;
  private result?: LocalFile;

  context = createContext({
    schema: z.object({
      status: z.enum(["idle", "recording", "ready", "error"]),
      duration: z.number(),
      error: z.string().optional(),
      previewUrl: z.string().optional(),
    }),
    data: async (): Promise<VoiceChatState> => ({
      status: "idle",
      duration: 0,
    }),
  });

  protected async boot() {
    await this.context.init();
  }

  protected title() {
    return "Голосовое сообщение";
  }

  protected content() {
    return [
      text(this.context.ref("status")),
      text(this.context.ref("duration")),
      button(
        {
          onClick: () => void this.startRecording(),
          conditions: [when.equals(this.context.ref("status"), "idle")],
        },
        [text("Записать")],
      ),
      button(
        {
          onClick: () => void this.finishRecording(),
          conditions: [when.equals(this.context.ref("status"), "recording")],
        },
        [text("Стоп")],
      ),
      button(
        {
          onClick: () => void this.playPreview(),
          conditions: [when.equals(this.context.ref("status"), "ready")],
        },
        [text("Прослушать")],
      ),
      button(
        {
          onClick: () => void this.reset(),
          conditions: [when.equals(this.context.ref("status"), "ready")],
        },
        [text("Сбросить")],
      ),
    ];
  }

  private platform(): ClientPlatform {
    const platform = currentClientPlatform();
    if (!(platform instanceof ClientPlatform)) {
      throw new Error("Запись доступна только на клиентской платформе");
    }
    return platform;
  }

  private async startRecording() {
    const platform = this.platform();
    this.context.set({ status: "recording", duration: 0, error: undefined });

    try {
      this.mic = await firstValueFrom(platform.getUserMedia({ audio: true }));
      this.recording = await firstValueFrom(
        platform.createRecording({
          streams: this.mic,
          onTimeUpdate: ({ duration }) => {
            this.context.set({ duration });
          },
          onError: ({ message }) => {
            this.context.set({ status: "error", error: message });
          },
        }),
      );
      await firstValueFrom(this.recording.start());
    } catch (error) {
      this.context.set({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      await this.cleanupStreams();
    }
  }

  private async finishRecording() {
    if (!this.recording) {
      return;
    }
    try {
      this.result = await firstValueFrom(this.recording.stop());
      this.context.set({
        status: "ready",
        previewUrl: this.result.url,
        duration: this.result.duration,
      });
      // Дальше: this.result.upload({ url }) / this.result.save()
    } catch (error) {
      this.context.set({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await firstValueFrom(this.recording.destroy());
      this.recording = undefined;
      await this.cleanupStreams();
    }
  }

  private async playPreview() {
    if (!this.result) {
      return;
    }
    const platform = this.platform();
    const audio = await firstValueFrom(
      platform.createAudio({ src: this.result.url }),
    );
    await firstValueFrom(audio.play());
  }

  private async reset() {
    if (this.result) {
      await firstValueFrom(this.result.destroy());
      this.result = undefined;
    }
    this.context.set({
      status: "idle",
      duration: 0,
      previewUrl: undefined,
      error: undefined,
    });
  }

  private async cleanupStreams() {
    if (this.mic) {
      await firstValueFrom(this.mic.stop());
      this.mic = undefined;
    }
  }
}
```

`recording.stop()` и `filePicker.onSelect` отдают один и тот же тип `LocalFile`
(у записи дополнительно `duration` и `kind`).

---

## 2. Выбор конкретного микрофона

Задача: если микрофонов несколько, показать список и писать с выбранного
`deviceId`.

Перед `enumerateDevices` метки устройств часто пустые, пока нет permission.
Короткий «прогрев» `getUserMedia({ audio: true })` → `stop()` заполняет
`label`.

```ts
import {
  AudioInputDevice,
  ClientPlatform,
  currentClientPlatform,
} from "@matreshka/bff/platforms";
import { firstValueFrom } from "rxjs";

async function listMicrophones(platform: ClientPlatform) {
  // 1. Permission + labels
  const warm = await firstValueFrom(platform.getUserMedia({ audio: true }));
  await firstValueFrom(warm.stop());

  // 2. Список устройств (API enumerateDevices не менялся)
  const devices = await firstValueFrom(platform.enumerateDevices());
  return devices.filter(
    (device): device is AudioInputDevice => device instanceof AudioInputDevice,
  );
}

async function recordFromDevice(
  platform: ClientPlatform,
  mic: AudioInputDevice,
) {
  const stream = await firstValueFrom(
    platform.getUserMedia({
      audio: { deviceId: { exact: mic.deviceId } },
    }),
  );

  const recording = await firstValueFrom(
    platform.createRecording({ streams: stream }),
  );
  await firstValueFrom(recording.start());

  // … позже
  const file = await firstValueFrom(recording.stop());
  await firstValueFrom(recording.destroy());
  await firstValueFrom(stream.stop());
  return file;
}
```

В UI обычно кладут `deviceId` / `label` в `Context`, рисуют список кнопками и в
`onClick` вызывают `recordFromDevice` с выбранным устройством.

То же для камеры: `VideoInputDevice` и
`getUserMedia({ video: { deviceId: { exact } } })`.

---

## 3. Пауза и продолжение

Задача: как диктофон — `pause` / `resume`, длительность только «чистого» времени
записи (клиент не считает паузу).

```ts
import { when } from "@matreshka/bff/core/conditions";

button(
  {
    onClick: () => {
      void firstValueFrom(this.recording!.pause()).then(() => {
        this.context.set({ status: "paused" });
      });
    },
    conditions: [when.equals(this.context.ref("status"), "recording")],
  },
  [text("Пауза")],
);

button(
  {
    onClick: () => {
      void firstValueFrom(this.recording!.resume()).then(() => {
        this.context.set({ status: "recording" });
      });
    },
    conditions: [when.equals(this.context.ref("status"), "paused")],
  },
  [text("Продолжить")],
);
```

Повторный `start()` на той же сессии `Recording` после `stop()` допустим: на
клиенте создаётся новый `MediaRecorder` на тех же `MediaStreamRef`. Если потоки
уже `stop()` — сначала снова `getUserMedia`.

---

## 4. Видеозаметка с камеры

Задача: записать короткий ролик с камеры и проиграть через `createVideo`.

```ts
import { MediaKind } from "@matreshka/bff/platforms";

const platform = this.platform();

const camera = await firstValueFrom(
  platform.getUserMedia({
    audio: true,
    video: { facingMode: "user" },
  }),
);

const recording = await firstValueFrom(
  platform.createRecording({ streams: camera }),
);
await firstValueFrom(recording.start());

// …
const file = await firstValueFrom(recording.stop());
await firstValueFrom(recording.destroy());
await firstValueFrom(camera.stop());

if (file.kind === MediaKind.Video) {
  const video = await firstValueFrom(platform.createVideo({ src: file.url }));
  await firstValueFrom(video.play());
}
```

`kind` в результате зависит от наличия video-треков в исходных потоках, а не
только от `mimeType`.

---

## 5. Запись экрана

Задача: снять экран (или окно) через системный пикер браузера.

`getDisplayMedia` **не** использует `enumerateDevices` — источник выбирает
пользователь в UI браузера. Нужен свежий user gesture.

```ts
button(
  {
    onClick: () => void this.recordScreen(),
  },
  [text("Записать экран")],
);

private async recordScreen() {
  const platform = this.platform();
  const screen = await firstValueFrom(
    platform.getDisplayMedia({ video: true, audio: true }),
  );
  // audio: true — системный звук вкладки/экрана, если браузер отдаёт

  const recording = await firstValueFrom(
    platform.createRecording({ streams: screen }),
  );
  await firstValueFrom(recording.start());
  this.screen = screen;
  this.recording = recording;
}
```

Если пользователь закрыл пикер — observable завершится ошибкой; покажите её в UI.

---

## 6. Экран + микрофон (как в классическом JS)

Задача: видео с экрана и голос с микрофона в одном файле — клиент склеивает
треки в один `MediaStream` перед `MediaRecorder`.

```ts
import { combineLatest, firstValueFrom } from "rxjs";

const platform = this.platform();

const [screen, mic] = await firstValueFrom(
  combineLatest([
    platform.getDisplayMedia({ video: true, audio: false }),
    platform.getUserMedia({ audio: true }),
  ]),
);

const recording = await firstValueFrom(
  platform.createRecording({
    streams: [screen, mic],
    // mimeType: "video/webm;codecs=vp9,opus", // опционально, best-effort
  }),
);

await firstValueFrom(recording.start());

// …
const file = await firstValueFrom(recording.stop());
await firstValueFrom(recording.destroy());
await firstValueFrom(screen.stop());
await firstValueFrom(mic.stop());

const video = await firstValueFrom(platform.createVideo({ src: file.url }));
await firstValueFrom(video.play());
```

Эквивалент вручную в браузере:

```js
const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
const stream = new MediaStream([
  ...screen.getVideoTracks(),
  ...microphone.getAudioTracks(),
]);
const recorder = new MediaRecorder(stream);
```

---

## 7. Только захват потока без записи

Задача: открыть микрофон/камеру для своей логики (например, позже привязать к
preview), запись не нужна.

```ts
const mic = await firstValueFrom(
  platform.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  }),
);

console.log(mic.id, mic.tracks);
// Когда закончили:
await firstValueFrom(mic.stop());
```

`mic.tracks` — снимок метаданных на момент успеха (`kind`, `label`,
`settings`), не live-объект DOM.

---

## 8. Ошибки и отмена

| Ситуация                             | Что происходит                                           |
| ------------------------------------ | -------------------------------------------------------- |
| Пользователь отказал в permission    | `getUserMedia` / `getDisplayMedia` → error на Observable |
| Закрыл пикер экрана                  | `getDisplayMedia` → error                                |
| Нет устройства / неверный `deviceId` | `getUserMedia` → error (`NotFoundError` и т.п.)          |
| `start` без живых потоков            | `recording.start` → error                                |
| `stop`, когда запись не шла          | `recording.stop` → error                                 |

```ts
try {
  await firstValueFrom(platform.getUserMedia({ audio: true }));
} catch (error) {
  this.context.set({
    status: "error",
    error: error instanceof Error ? error.message : String(error),
  });
}
```

Обработчик `onError` у `createRecording` ловит ошибки самого `MediaRecorder`
(отдельные event-сообщения), а не отказ permission при `getUserMedia`.

---

## 9. Жизненный цикл и утечки

Рекомендуемый порядок завершения:

1. `recording.stop()` → `LocalFile` (upload / preview / save)
2. `recording.destroy()` — снять сессию recorder (blob не revoke'аит)
3. `stream.stop()` для каждого `MediaStreamRef`
4. `file.destroy()` — `revokeObjectURL`, когда файл больше не нужен

При `client.destroy$` сессии на BFF закрываются; на клиенте потоки тоже нужно
не оставлять «висящими» — явный `stop()` на ref остаётся ответственностью
приложения после успешного сценария.

---

## Что читать дальше

- [platforms.md — Захват и запись медиа](../reference/platforms.md#захват-и-запись-медиа) — сигнатуры API
- [platforms.md — Аудио и видео](../reference/platforms.md#аудио-и-видео) — `createAudio` / `createVideo`
- [platforms.md — enumerateDevices](../reference/platforms.md#enumeratedevices) — список устройств
- [platform-actions.md](../architecture/platform-actions.md) — ack / success / stream sessions
- [cookbook.md](cookbook.md) — короткие рецепты по другим задачам
