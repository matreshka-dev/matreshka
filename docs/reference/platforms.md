# Platforms

> Справочник platform API. Для onboarding достаточно [state-and-events](../getting-started/state-and-events.md) и guides; открывайте этот файл по задаче.

`Platform` в matreshka — это серверный API для взаимодействия с клиентским приложением на конкретной платформе.

Через платформу BFF может:

- навигировать;
- перезагружать приложение;
- показывать dialog/popover;
- управлять цветовой схемой;
- включать privacy mode;
- вызывать native picker;
- работать с platform-level overlays;
- запрашивать устройства, геолокацию, push, share и другие платформенные возможности.

## Как получить платформу

Обычно текущую платформу получают так:

```ts
const platform = currentClientPlatform();
```

Если нужно получить платформу для конкретного клиента:

```ts
const platform = clientPlatform(client);
```

## Дерево платформ

Полезно видеть платформы как иерархию:

```text
Platform
├─ ClientPlatform
│  ├─ WebPlatform
│  │  ├─ BrowserPlatform
│  │  │  └─ PwaPlatform
│  │  ├─ TelegramMiniAppPlatform
│  │  └─ MaxMiniAppPlatform
│  └─ MobilePlatform
│     ├─ AndroidPlatform
│     └─ IosPlatform
└─ ServerPlatform
```

Из этой структуры следует важная идея:

- методы из `Platform` доступны всем платформам;
- методы из `WebPlatform`-ветки доступны веб-платформам;
- методы из `MobilePlatform`-ветки доступны мобильным платформам;
- методы конкретных платформ доступны только им.

## Как проверять конкретную платформу

Если нужен платформозависимый код, можно использовать `instanceof`.

```ts
const platform = currentClientPlatform();

if (platform instanceof BrowserPlatform) {
  platform.openFile(url);
}
```

```ts
const platform = currentClientPlatform();

if (platform instanceof MobilePlatform) {
  const scanSubscription = platform
    .requestBLEScan({})
    .subscribe((device) => console.log(device));
  // scanSubscription.unsubscribe(); — остановить скан
}
```

Это особенно полезно, когда одна часть логики общая, а другая зависит от платформы.

## Platform-action и `Observable`

Платформенные методы на BFF возвращают **`Observable`**, кроме синхронного **`getOverlays()`** (снимок оверлеев только на сервере).

Зачем observable, даже когда у действия **нет видимого результата** (privacy mode, смена темы, `share`, скачивание файла):

- важен **момент завершения** — можно снять loading, перейти к следующему шагу сценария, записать метрику;
- BFF **узнаёт об ошибке** на клиенте (отказ в разрешении, сбой API, отмена диалога), а не остаётся в неопределённости.

Запрос на клиент уходит **сразу при вызове** метода; подписка нужна только если серверному коду нужно дождаться исхода. Без подписки действие на клиенте всё равно выполняется; без ответа клиента observable не завершится (кроме уничтожения клиента).

Подробнее о контракте request/response — в [`platform-actions.md`](../architecture/platform-actions.md). У **`reload()`** особая семантика завершения (см. ниже).

### Что считается «завершением»

Ack клиента и завершение observable на BFF означают **не одно и то же для всех методов**. Момент «успеха» задаётся **спецификой действия** на клиенте: observable фиксирует, что клиент **дошёл до согласованной точки** в этом сценарии, а не обязательно что пользователь полностью закончил работу с UI или OS.

| Тип действия                                      | Типичный момент ack (успех)                                                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Геолокация, контакт, WebAuthn, push               | Клиент получил данные или credential и отправил success-сообщение                                                                                                                                       |
| `showDialog` / `showPopover`                      | Компонент смонтирован на клиенте (не закрытие пользователем)                                                                                                                                            |
| Native picker                                     | Picker открыт (выбор значения идёт в Context отдельно)                                                                                                                                                  |
| **Скачивание файла** (`downloadFile`, CSV и т.п.) | Клиент **инициировал** скачивание (например, браузер принял запрос через `<a download>` / blob URL). **Фактическое окончание** загрузки на диск OS/API **не отслеживается** — это ограничение платформы |
| `share`                                           | Системный share sheet вызван или ссылка передана (зависит от платформы)                                                                                                                                 |
| Privacy mode, тема, overlays                      | Изменение применено на клиенте                                                                                                                                                                          |
| **`navigate()`** (внутренний SPA)                 | **Не targeted ack.** Смена `route.visitedAt`, receipt `AppPageMessage`, `{ routeMatched }`                                                                                                              |
| `navigate()` (внешний URL)                        | Сразу `{ routeMatched: false }` после отправки команды                                                                                                                                                  |
| **`back()`** (внутренний SPA)                     | **Не targeted ack.** Смена `route.visitedAt` и receipt `AppPageMessage` (как navigate без проверки path)                                                                                                |
| **`reload()`**                                    | **Не ack с клиента.** BFF ждёт **`Client.reconnect$`**: WebSocket переподключился с тем же token (grace period) — **эвристика**, что страница перезагрузилась после команды                             |

Перед тем как строить бизнес-логику «после скачивания», сверяйтесь с описанием конкретного метода в этом справочнике и с реализацией на клиенте.

### Как дождаться завершения

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(platform.downloadFile(url, "report.pdf"));
// дальше — после ack: скачивание *запущено* на клиенте, не обязательно дописано на диск
```

### Как обработать ошибку

Ошибка с клиента приходит как **`Error`** в observable (текст из `ErrorMessage`).

Через `firstValueFrom` и `try/catch`:

```ts
try {
  await firstValueFrom(platform.getGeolocation());
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
}
```

Через `subscribe`:

```ts
platform.requestContact().subscribe({
  next: (data) => console.log(data),
  error: (error) => console.error(error.message),
});
```

Для действий без payload после успеха observable один раз эмитит `undefined` и завершается.

## Методы базового `Platform`

Ниже методы, которые доступны всем платформам.

### `navigate(path: string)`

Переводит клиент на другой route. Возвращает `Observable<NavigateResult>` (`{ routeMatched: boolean }`).

Для **внутреннего SPA** observable завершается, когда:

1. клиент сообщил новый `route.visitedAt` (навигация произошла);
2. BFF отправил `AppPageMessage` для этого route и клиент подтвердил получение (`message-received`);
3. в результате эмитится **`routeMatched`**: совпал ли фактический path/query с **маской** из аргумента `path` (литералы и query — точно; `@{context.path}` и `{param}` — wildcard сегмента, без подстановки значений контекста с BFF).

Редирект guard на другой URL — **не ошибка**, а `{ routeMatched: false }`. **Ошибка** observable — в основном уничтожение клиента (`Client.destroy$`) до успешного завершения. Timeout не используется: BFF ждёт доставку page (retry через reliable delivery) или конец сессии клиента.

**Внешний URL** (`https://…`): команда уходит на клиент, observable сразу завершается с `{ routeMatched: false }`.

```ts
import { firstValueFrom } from "rxjs";

const { routeMatched } = await firstValueFrom(
  currentClientPlatform().navigate("/profile"),
);
if (!routeMatched) {
  // например guard перенаправил на /login
}
```

Использовать, когда решение о переходе должно приниматься на BFF.

### `back()`

Переходит на предыдущую страницу в истории навигации клиента. Возвращает `Observable<void>`.

Завершение для **внутреннего SPA** — как у `navigate` без `routeMatched`: новый `route.visitedAt`, затем receipt `AppPageMessage`. Targeted ack с клиента не используется. Timeout нет; **ошибка** — в основном `Client.destroy$` до завершения.

Если «назад» выводит за пределы SPA (нет смены route и page), observable **не завершится**, пока жив клиент — по той же логике, что и зависший navigate без page.

```ts
await firstValueFrom(currentClientPlatform().back());
```

### `reload()`

Перезагружает клиентское приложение (`location.reload()`). Возвращает `Observable<void>` с **особой логикой**:

1. BFF отправляет `AppReloadMessage` (без targeted ack с клиента — JS-контекст уничтожается).
2. Observable завершается при первом **`client.reconnect$`** после отправки: клиент переподключил WebSocket с тем же token в grace period.

```ts
await firstValueFrom(currentClientPlatform().reload());
// сессия BFF жива, transport снова attached; UI — новый boot на клиенте
```

Это **эвристика** («скорее всего reload дошёл и страница поднялась снова»), а не строгое подтверждение. Если grace period истёк или reconnect не произошёл — observable завершится ошибкой при `Client.destroy()`.

| Метод               | SPA / runtime                      | WebSocket                                       |
| ------------------- | ---------------------------------- | ----------------------------------------------- |
| `navigate` / `back` | Обычно SPA без полной перезагрузки | Остаётся открытым                               |
| `reload`            | Полная перезагрузка документа      | Закрывается и открывается заново → `reconnect$` |

Подробнее про reconnect и grace period — в [`operations.md`](../architecture/operations.md).

### `enablePrivacyMode()`

Включает режим конфиденциальности. Возвращает `Observable<void>`.

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(currentClientPlatform().enablePrivacyMode());
```

Это единый BFF-метод, но фактическое поведение зависит от платформы:

- на web может включаться blur при потере фокуса;
- на mobile может использоваться нативная защита экрана;
- конкретный эффект зависит от клиентской реализации.

### `disablePrivacyMode()`

Отключает режим конфиденциальности. Возвращает `Observable<void>`.

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(currentClientPlatform().disablePrivacyMode());
```

Обычно используется как парный вызов к `enablePrivacyMode()`.

### `setColorSchemeLight()` / `setColorSchemeDark()` / `setColorSchemeSystem()`

Переключают тему на клиенте. Каждый метод возвращает `Observable<void>`.

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(currentClientPlatform().setColorSchemeDark());
```

### `showDialog(dialog: Dialog)`

Показывает `Dialog`. Возвращает `Observable<void>` (завершается после монтирования на клиенте).

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(currentClientPlatform().showDialog(dialog));
```

Использовать, когда нужен самостоятельный entry-слой поверх страницы без привязки к якорному компоненту.

### `showPopover(source, popover)` / `showPopover({ anchor, source }, popover)`

Показывает `Popover` на клиенте.

```ts
import { firstValueFrom } from "rxjs";

// source и визуальный anchor — один инстанс (типичный onClick)
await firstValueFrom(currentClientPlatform().showPopover(instance, popover));

// source — кнопка, визуальный anchor — другой элемент (например шапка)
await firstValueFrom(
  currentClientPlatform().showPopover(
    { source: buttonInstance, anchor: headerInstance },
    popover,
  ),
);
```

Типы BFF: `PopoverShowComponent` — инстанс или компонент; `PopoverShowPlacement` — `{ anchor, source }`.

| Поле       | Зачем                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **source** | Откуда открыли popover (часто кнопка в `onClick`). Браузер связывает popover с этим элементом при навигации с клавиатуры.                                                                    |
| **anchor** | Где на экране «держать» popover. Если передали один инстанс — якорь совпадает с source. Отдельный якорь нужен, когда клик на одном элементе, а показывать рядом с другим (например у шапки). |

В сообщении `show-popover` на клиент всегда уходит `source` и `popover`. Поле `anchor` — только при вызове с `{ anchor, source }`.

Куда именно смещать popover относительно якоря, задаётся свойством `positionArea` у `Popover`.

### `showDatePicker(anchor, ref: ContextValueRef<string | undefined>)`

Открывает native date picker и связывает результат с `ref` — ссылка на строковое поле контекста.

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(
  currentClientPlatform().showDatePicker(
    instance,
    this.context.ref("birthday"),
  ),
);
```

### `showColorPicker(anchor, ref: ContextValueRef<string | undefined>)`

Открывает native color picker. Возвращает `Observable<void>` (picker открыт на клиенте).

```ts
await firstValueFrom(
  currentClientPlatform().showColorPicker(instance, this.context.ref("color")),
);
```

### `showTimePicker(anchor, ref: ContextValueRef<string | undefined>)`

Открывает native time picker.

```ts
await firstValueFrom(
  currentClientPlatform().showTimePicker(instance, this.context.ref("time")),
);
```

### `showDateTimePicker(anchor, ref: ContextValueRef<string | undefined>)`

Открывает native datetime picker.

```ts
await firstValueFrom(
  currentClientPlatform().showDateTimePicker(
    instance,
    this.context.ref("meetingAt"),
  ),
);
```

### `setOverlays(overlays)`

Устанавливает platform-level overlays.

```ts
await firstValueFrom(
  currentClientPlatform().setOverlays([
    {
      anchors: [OverlayAnchor.Bottom, OverlayAnchor.Center],
      component: floatingActionComponent,
    },
  ]),
);
```

Использовать, когда overlay должен жить на уровне платформы, а не конкретного контейнера или страницы.

### `getOverlays()`

Возвращает текущие platform overlays.

```ts
const overlays = currentClientPlatform().getOverlays();
```

Обычно это вспомогательный метод для серверной логики, которая управляет overlays.

### `enumerateDevices()`

Запрашивает у клиента список доступных media devices.

```ts
import { firstValueFrom } from "rxjs";

const devices = await firstValueFrom(
  currentClientPlatform().enumerateDevices(),
);
console.log(devices);
```

Возвращает инстансы:

- `AudioInputDevice`
- `VideoInputDevice`
- `AudioOutputDevice`

Это полезно для:

- выбора микрофона;
- выбора камеры;
- camera-сценариев с переключением между `videoinput`-устройствами.

## Web-платформы

К веб-ветке относятся:

- `BrowserPlatform`
- `PwaPlatform`
- `TelegramMiniAppPlatform`
- `MaxMiniAppPlatform`

Базовый `WebPlatform` сам почти не добавляет методов, а служит общей категорией.

## Методы `BrowserPlatform`

`BrowserPlatform` — обычный браузерный клиент.

### `getGeolocation()`

Запрашивает геолокацию.

```ts
import { firstValueFrom } from "rxjs";

if (platform instanceof BrowserPlatform) {
  const { latitude, longitude } = await firstValueFrom(
    platform.getGeolocation(),
  );
  console.log(latitude, longitude);
}
```

### `addEventToCalendar(data)`

Создает событие в календаре.

```ts
platform.addEventToCalendar({ start: Date.now(), summary: "Встреча" });

await firstValueFrom(
  platform.addEventToCalendar({
    start: Date.now(),
    summary: "Встреча",
  }),
);
```

### `downloadCsvContent(filename, content)`

Скачивает CSV, сформированный на BFF.

```ts
await firstValueFrom(
  platform.downloadCsvContent("report", [
    ["Name", "Value"],
    ["Alice", "42"],
  ]),
);
```

### `TelegramMiniAppPlatform.downloadFile(url, filename)`

Запускает скачивание файла по URL.

```ts
platform.downloadFile(fileUrl, "report.pdf");
```

### `downloadFile(url, filename)`

Скачивает файл по URL (Browser / PWA).

```ts
await firstValueFrom(platform.downloadFile(fileUrl, "report.pdf"));
```

### `openFile(url)`

Открывает файл внутри браузерного просмотрщика.

```ts
await firstValueFrom(platform.openFile(fileUrl));
```

### `share(data)`

Открывает системный web share dialog (Browser / PWA).

```ts
await firstValueFrom(
  platform.share({
    title: "Delta",
    text: "Посмотри это",
    url: "https://example.com",
  }),
);
```

### `TelegramMiniAppPlatform.share(data)`

Открывает системный web share dialog.

```ts
platform.share({
  title: "Delta",
  text: "Посмотри это",
  url: "https://example.com",
});
```

### `registerPushNotifications(publicKey)`

Запрашивает разрешение на push и отдает браузерную subscription.

```ts
import { firstValueFrom } from "rxjs";

const subscription = await firstValueFrom(
  platform.registerPushNotifications("VAPID_PUBLIC_KEY"),
);
console.log(subscription.endpoint);
```

### `createWebAuthnCredential(optionsJSON)` / `getWebAuthnCredential(optionsJSON)`

WebAuthn (passkeys) только на **Browser** и **PWA** (`BrowserPlatform` / `PwaPlatform`). **Mobile (Capacitor) пока не поддерживается** — методы есть только на BFF-классе `BrowserPlatform`; на клиенте обработчик только в `BrowserPlatform`.

**Общий поток на BFF:**

1. Сгенерировать `optionsJSON` на сервере (`@matreshka/bff/webauthn`) и **сохранить challenge** (сессия, Redis, БД — на ваш выбор).
2. Вызвать метод платформы — клиент покажет системный диалог (Face ID, Windows Hello и т.д.) и вернёт `credentialJSON`.
3. Верифицировать ответ на BFF тем же пакетом и только после `verified: true` считать пользователя зарегистрированным / вошедшим.

**Требования среды:**

| Условие                     | Зачем                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| HTTPS (secure context)      | Без этого браузер/WebView не вызывает WebAuthn                                                      |
| `rpID` = registrable domain | Должен совпадать с доменом страницы (без порта): для `https://app.example.com` обычно `example.com` |
| `expectedOrigin` при verify | Полный origin клиента, например `https://app.example.com` — **не** путать с `rpID`                  |

#### Как выбрать `rpID` (что именно вводить)

`rpID` — это **домен сайта**, к которому браузер привязывает passkey. Это не URL целиком: **без** `https://`, **без** пути и **без** порта.

**Правило:** возьмите адресную строку, где открыт клиент Matreshka, и оставьте только host. Если host — поддомен публичного домена, для WebAuthn часто используют **effective domain** (registrable domain): один `rpID` на `app.example.com` и `www.example.com` → `example.com`. Если приложение живёт только на одном host и вы хотите изолировать passkeys — можно указать **точный** host как `rpID` (см. таблицу ниже).

| Открыт клиент по адресу                         | Что писать в `rpID`                                                     | `expectedOrigin` при verify |
| ----------------------------------------------- | ----------------------------------------------------------------------- | --------------------------- |
| `https://localhost:4200` (локальная разработка) | `localhost`                                                             | `https://localhost:4200`    |
| `https://127.0.0.1:4200`                        | `127.0.0.1` (не смешивать с `localhost` — для WebAuthn это разные rpID) | `https://127.0.0.1:4200`    |
| `https://app.example.com`                       | `example.com` или `app.example.com`                                     | `https://app.example.com`   |
| `https://example.com`                           | `example.com`                                                           | `https://example.com`       |
| `https://my-app.vercel.app`                     | `my-app.vercel.app` (полный host; общий `vercel.app` для всех нельзя)   | `https://my-app.vercel.app` |

**На практике:**

1. Посмотрите `origin` в DevTools → Console: `location.origin` (это значение для `expectedOrigin`).
2. Для `rpID` возьмите `location.hostname` **или** registrable domain вашего прод-домена, если passkeys должны работать на нескольких поддоменах с одним `rpID`.
3. В `generateRegistrationOptions`, `generateAuthenticationOptions`, `verifyRegistrationResponse` и `verifyAuthenticationResponse` используйте **один и тот же** `rpID` / `expectedRPID`. `expectedOrigin` должен совпадать с тем origin, с которого реально идёт запрос.

**Типичные ошибки:**

- `rpID: "https://example.com"` — нельзя, только домен: `example.com`.
- `rpID: "example.com"`, а клиент открыт на `https://other.com` — verify не пройдёт.
- Регистрация на `localhost`, вход на `127.0.0.1` — разные rpID, passkey не найдётся.

`rpName` — это просто **название для человека** в диалоге («Мой банк»); на криптографию не влияет. `rpID` — технический идентификатор, его нельзя менять после того, как пользователи уже создали passkeys.

Методы платформы Matreshka **не** подставляют `expectedOrigin` / `rpID` автоматически — их задаёт код приложения.

#### Параметры `createWebAuthnCredential` / `getWebAuthnCredential`

| Параметр      | Назначение                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `optionsJSON` | Объект от `generateRegistrationOptions` или `generateAuthenticationOptions`. Передаётся на клиент как есть; внутри есть одноразовый **challenge**. |

Методы возвращают `Observable` с `credentialJSON` или ошибкой (`Error` с текстом от клиента). Ceremonия на клиенте стартует при вызове; для результата — `firstValueFrom` или `subscribe`.

---

#### Регистрация passkey (подробный пример)

```ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type StoredWebAuthnCredential,
} from "@matreshka/bff/webauthn";
import { BrowserPlatform } from "@matreshka/bff/platforms";
import { currentClientPlatform } from "@matreshka/bff/platforms/utils/client-platform";
import { firstValueFrom } from "rxjs";

const platform = currentClientPlatform();
const rpID = "example.com";
const expectedOrigin = "https://app.example.com";

if (!(platform instanceof BrowserPlatform)) {
  return;
}

// --- generateRegistrationOptions ---
const optionsJSON = await generateRegistrationOptions({
  rpName: "My App",
  rpID,
  userName: "user@example.com",
  userID: new Uint8Array([1, 2, 3, 4]),
  userDisplayName: "Иван Иванов",
  attestationType: "none",
  authenticatorSelection: {
    residentKey: "preferred",
    userVerification: "preferred",
  },
});

// Сохраните optionsJSON.challenge на сервере до вызова verify (привязка к userId / sessionId).
await savePendingChallenge(userId, optionsJSON.challenge);

try {
  const credentialJSON = await firstValueFrom(
    platform.createWebAuthnCredential(optionsJSON),
  );

  const expectedChallenge = await loadPendingChallenge(userId);
  if (!expectedChallenge) return;

  const verification = await verifyRegistrationResponse({
    response: credentialJSON,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return;
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  const stored: StoredWebAuthnCredential = {
    credentialID: credential.id,
    credentialPublicKey: credential.publicKey,
    counter: credential.counter,
    credentialDeviceType,
    credentialBackedUp,
    transports: credential.transports,
    webauthnUserID: credential.webauthnUserID,
  };
  await saveCredential(userId, stored);
  await clearPendingChallenge(userId);
} catch (error) {
  // отмена пользователем, нет WebAuthn и т.д.
}
```

**`generateRegistrationOptions` — что означает каждый параметр:**

| Параметр                                  | Обязательность | Смысл                                                                                                                                                              |
| ----------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rpName`                                  | да             | Человекочитаемое имя сайта/приложения в диалоге authenticator («My App»).                                                                                          |
| `rpID`                                    | да             | Идентификатор relying party — домен без схемы и порта. Credential привязывается к нему; при входе `expectedRPID` должен совпадать.                                 |
| `userName`                                | да             | Логин для отображения (часто email). Не секрет; не заменяет проверку на сервере после verify.                                                                      |
| `userID`                                  | да             | Стабильный **байтовый** id пользователя в вашей системе (не email). Должен быть неизменным для одного аккаунта; длина обычно до 64 байт.                           |
| `userDisplayName`                         | нет            | Имя в UI authenticator («Иван Иванов»).                                                                                                                            |
| `attestationType`                         | нет            | `"none"` — без attestation (типично для passkeys в вебе). Другие значения — если нужна проверка модели authenticator.                                              |
| `authenticatorSelection.residentKey`      | нет            | `"preferred"` / `"required"` — discoverable credential (passkey в менеджере паролей); `"discouraged"` — только security key без привязки к аккаунту на устройстве. |
| `authenticatorSelection.userVerification` | нет            | `"preferred"` / `"required"` — биометрия/PIN на устройстве; `"discouraged"` — без проверки пользователя (редко для passkeys).                                      |

**Поля в возвращаемом `optionsJSON` (важные для приложения):**

| Поле                                | Смысл                                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `challenge`                         | Одноразовая случайная строка (base64url). **Обязательно** сохранить на сервере и передать в `expectedChallenge` при verify. |
| `rp`, `user`, `pubKeyCredParams`, … | Уходит на клиент внутри `optionsJSON`; менять вручную после генерации не нужно.                                             |

**`verifyRegistrationResponse` — параметры verify:**

| Параметр                  | Смысл                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `response`                | Тот же `credentialJSON`, что вернул observable платформы.                                      |
| `expectedChallenge`       | Challenge из шага регистрации (из сохранённого `optionsJSON.challenge`), не из ответа клиента. |
| `expectedOrigin`          | Origin, с которого открыт клиент Matreshka (`https://…`).                                      |
| `expectedRPID`            | Тот же `rpID`, что при генерации options.                                                      |
| `requireUserVerification` | `true` — отклонить ответ без user verification (рекомендуется для passkeys).                   |

**`verification.registrationInfo` → запись в БД (`StoredWebAuthnCredential`):**

| Поле                   | Смысл                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| `credentialID`         | Id credential для последующего входа (`allowCredentials`).                    |
| `credentialPublicKey`  | Публичный ключ для проверки подписи при authentication.                       |
| `counter`              | Счётчик использований authenticator; обновлять после каждого успешного входа. |
| `credentialDeviceType` | `"singleDevice"` или `"multiDevice"` (синхронизируемый passkey).              |
| `credentialBackedUp`   | Был ли credential синхронизирован в облако (iCloud/Google и т.д.).            |
| `transports`           | Подсказки (`internal`, `hybrid`, …) — опционально для UX.                     |
| `webauthnUserID`       | Ваш `userID` в формате, который вернул authenticator.                         |

---

#### Вход по passkey (подробный пример)

```ts
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@matreshka/bff/webauthn";
import { firstValueFrom } from "rxjs";

const rpID = "example.com";
const expectedOrigin = "https://app.example.com";

const stored = await loadCredentialByUserId(userId);

const authOptionsJSON = await generateAuthenticationOptions({
  rpID,
  allowCredentials: [
    {
      id: stored.credentialID,
      transports: stored.transports,
    },
  ],
  userVerification: "preferred",
});

await savePendingChallenge(userId, authOptionsJSON.challenge);

try {
  const credentialJSON = await firstValueFrom(
    platform.getWebAuthnCredential(authOptionsJSON),
  );

  const expectedChallenge = await loadPendingChallenge(userId);

  const verification = await verifyAuthenticationResponse({
    response: credentialJSON,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
    credential: {
      id: stored.credentialID,
      publicKey: stored.credentialPublicKey,
      counter: stored.counter,
      transports: stored.transports,
    },
  });

  if (verification.verified) {
    await updateCredentialCounter(
      userId,
      verification.authenticationInfo.newCounter,
    );
    await clearPendingChallenge(userId);
    // создать сессию приложения
  }
} catch (error) {
  // отмена, ошибка клиента
}
```

**`generateAuthenticationOptions`:**

| Параметр                        | Смысл                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `rpID`                          | Домен relying party — как при регистрации.                                                                                  |
| `allowCredentials`              | Список известных credential пользователя. Если пустой/не передан — **discoverable** вход (passkey из списка на устройстве). |
| `allowCredentials[].id`         | `credentialID` из БД.                                                                                                       |
| `allowCredentials[].transports` | Опционально ускоряет выбор authenticator.                                                                                   |
| `userVerification`              | Как при регистрации: `"preferred"` или `"required"`.                                                                        |

**`verifyAuthenticationResponse` → `credential` (из вашей БД):**

| Поле         | Смысл                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `id`         | Id credential — тот же, что при регистрации.                                                              |
| `publicKey`  | Публичный ключ из `StoredWebAuthnCredential`.                                                             |
| `counter`    | Последний известный counter; после verify обновить на `authenticationInfo.newCounter` (защита от replay). |
| `transports` | Опционально, как при регистрации.                                                                         |

**`expectedChallenge` / `expectedOrigin` / `expectedRPID`** — те же правила, что при регистрации.

---

#### Discoverable passkey (вход без `allowCredentials`)

Если при регистрации использовали `residentKey: "preferred"` или `"required"`, можно вызывать:

```ts
const authOptionsJSON = await generateAuthenticationOptions({
  rpID: "example.com",
  userVerification: "preferred",
});
```

Браузер сам предложит подходящие passkeys для `rpID`. На verify всё равно нужно найти запись в БД по `credential.id` из ответа и передать её в `credential` для проверки подписи.

## `PwaPlatform`

`PwaPlatform` наследуется от `BrowserPlatform`.

Это значит:

- у него есть все методы `BrowserPlatform`;
- по BFF API он выглядит как браузерная платформа;
- отличие в клиентской среде исполнения, а не в наборе BFF-методов.

## Методы `TelegramMiniAppPlatform`

`TelegramMiniAppPlatform` наследуется от `WebPlatform`, но добавляет mini app-специфичные методы.

### `downloadFile(url, filename)`

Скачивание файла через Telegram Mini App.

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(platform.downloadFile(fileUrl, "invoice.pdf"));
```

### `share(data)`

Шаринг через Telegram Mini App.

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(
  platform.share({
    url: "https://example.com",
    text: "Ссылка",
  }),
);
```

### `TelegramMiniAppPlatform.initData(botToken)`

Проверяет и разбирает `initData`, пришедшие от Telegram.

```ts
const initData = platform.initData(process.env.TELEGRAM_BOT_TOKEN!);
```

Это серверный способ получить и провалидировать telegram mini app init payload.

### `TelegramMiniAppPlatform.getGeolocation()`

Запрашивает геолокацию внутри Telegram Mini App. Возвращает `Observable` с расширенным payload (accuracy, altitude и т.д.).

```ts
import { firstValueFrom } from "rxjs";

const position = await firstValueFrom(platform.getGeolocation());
console.log(position.latitude);
```

### `TelegramMiniAppPlatform.requestContact()`

Запрашивает контакт пользователя. Отмена диалога завершает observable ошибкой.

```ts
import { firstValueFrom } from "rxjs";

try {
  const data = await firstValueFrom(platform.requestContact());
  console.log(data.phone_number);
} catch {
  console.log("Пользователь отменил запрос");
}
```

## Методы `MaxMiniAppPlatform`

`MaxMiniAppPlatform` похож на Telegram Mini App, но с собственным API.

### `MaxMiniAppPlatform.requestContact()`

Запрашивает контакт пользователя.

```ts
import { firstValueFrom } from "rxjs";

const data = await firstValueFrom(platform.requestContact());
console.log(data.phone);
```

### `MaxMiniAppPlatform.initData(botToken)`

Проверяет и разбирает `initData`, пришедшие от Max Mini App.

```ts
const initData = platform.initData(process.env.MAX_BOT_TOKEN!);
```

## Mobile-платформы

К мобильной ветке относятся:

- `AndroidPlatform`
- `IosPlatform`

Обе наследуются от `MobilePlatform`, поэтому публичный BFF API у них одинаковый.

## Методы `MobilePlatform`

### `MobilePlatform.addEventToCalendar(data)`

Добавляет событие в системный календарь устройства.

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(
  platform.addEventToCalendar({
    start: Date.now(),
    summary: "Звонок",
  }),
);
```

### `MobilePlatform.downloadCsvContent(filename, content)`

Сохраняет CSV на устройство.

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(platform.downloadCsvContent("report", [["A", "B"]]));
```

### `MobilePlatform.downloadFile(url, filename)`

Скачивает файл на устройство.

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(platform.downloadFile(fileUrl, "document.pdf"));
```

### `MobilePlatform.share(data)`

Открывает системный share dialog.

```ts
import { firstValueFrom } from "rxjs";

await firstValueFrom(
  platform.share({
    text: "Поделиться",
    url: "https://example.com",
  }),
);
```

### `MobilePlatform.getGeolocation()`

Запрашивает геолокацию на мобильном устройстве.

```ts
import { firstValueFrom } from "rxjs";

const { latitude, longitude } = await firstValueFrom(platform.getGeolocation());
```

### `MobilePlatform.registerPushNotifications()`

Запрашивает push token.

```ts
import { firstValueFrom } from "rxjs";

const token = await firstValueFrom(platform.registerPushNotifications());
console.log(token.value);
```

### `MobilePlatform.requestBLEScan(config)`

Запускает BLE scan. **Hot:** команда на клиент уходит **при вызове** метода (как у остальных platform-action). Возвращает `Observable` с результатами сканирования; когда **не остаётся подписчиков**, на клиент уходит stop. Если подписчиков не было — скан идёт до ошибки или `destroy$` клиента.

```ts
const scan$ = platform.requestBLEScan({});
const subscription = scan$.subscribe((result) => {
  console.log(result.device.deviceId);
});

subscription.unsubscribe();
```

### `MobilePlatform.connectToBLEDevice(deviceId)`

Подключается к BLE-устройству и возвращает `Observable<BLEDevice>` (platform-action).

```ts
platform.connectToBLEDevice(deviceId).subscribe({
  next: (device) => {
    /* устройство подключено */
  },
  error: (err) => {
    /* ошибка подключения */
  },
});
```

Эквивалент: `new BLEDevice(deviceId, client).connect()` на стороне BFF — снаружи используйте только `connectToBLEDevice`.

## BLEDevice

После успешного `connectToBLEDevice` доступен объект с методами:

- `disconnect()` → `Observable<void>`
- `read(serviceId, characteristicId)` → `Observable<number>`
- `getServices()` → `Observable<MobileBleService[]>`
- `discoverServices()` → `Observable<MobileBleService[]>`

Событие **`disconnect$`**: неожиданный разрыв связи на клиенте (callback Capacitor BLE), не путать с явным `disconnect()`.

Пример:

```ts
platform.connectToBLEDevice(deviceId).subscribe((device) => {
  device.disconnect$.subscribe(() => {
    console.log("Связь потеряна");
  });
});
```

## `AndroidPlatform` и `IosPlatform`

На BFF-уровне `AndroidPlatform` и `IosPlatform` не добавляют новых публичных методов поверх `MobilePlatform`.

Это значит:

- различие между ними важно для `instanceof`;
- конкретное поведение может отличаться на клиенте;
- но набор серверных вызовов у них одинаковый.

## `ServerPlatform`

`ServerPlatform` наследуется напрямую от `Platform`.

Это специальный вариант для серверного исполнения. У него остаются только базовые платформенные возможности.

Использовать его отдельно обычно не нужно — он выбирается matreshka автоматически, если `platform.id === Server`.

## Практический подход

Полезная стратегия такая:

1. Сначала писать логику через базовый `Platform`, если вам хватает общих методов.
2. Если нужен платформоспецифичный API, проверять платформу через `instanceof`.
3. Если работа идет с web/mobile/mini app возможностями, переходить к соответствующему подклассу.

## Что читать дальше

- `layout.md` — чтобы отдельно разобраться в `stack`, `grid`, `row`, `column` и `surface`.
- `cookbook.md` — чтобы посмотреть короткие прикладные сценарии использования platform API.
