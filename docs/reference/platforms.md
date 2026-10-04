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
  const stopScan = platform.requestBLEScan({
    onReceive: (device) => console.log(device),
  });
}
```

Это особенно полезно, когда одна часть логики общая, а другая зависит от платформы.

## Методы базового `Platform`

Ниже методы, которые доступны всем платформам.

### `navigate(path: string)`

Переводит клиент на другой route.

```ts
currentClientPlatform().navigate("/profile");
```

Использовать, когда решение о переходе должно приниматься на BFF.

### `back()`

Переходит на предыдущую страницу в истории навигации клиента.

```ts
currentClientPlatform().back();
```

Использовать, когда нужно вернуть пользователя назад без явного указания route.

### `reload()`

Перезагружает клиентское приложение.

```ts
currentClientPlatform().reload();
```

Полезно, когда:

- нужно полностью сбросить клиентский runtime;
- BFF понял, что состояние устарело;
- требуется полная повторная инициализация.

### `enablePrivacyMode()`

Включает режим конфиденциальности.

```ts
currentClientPlatform().enablePrivacyMode();
```

Это единый BFF-метод, но фактическое поведение зависит от платформы:

- на web может включаться blur при потере фокуса;
- на mobile может использоваться нативная защита экрана;
- конкретный эффект зависит от клиентской реализации.

### `disablePrivacyMode()`

Отключает режим конфиденциальности.

```ts
currentClientPlatform().disablePrivacyMode();
```

Обычно используется как парный вызов к `enablePrivacyMode()`.

### `setColorSchemeLight()`

Принудительно включает светлую тему.

```ts
currentClientPlatform().setColorSchemeLight();
```

### `setColorSchemeDark()`

Принудительно включает темную тему.

```ts
currentClientPlatform().setColorSchemeDark();
```

### `setColorSchemeSystem()`

Возвращает клиент к системной теме.

```ts
currentClientPlatform().setColorSchemeSystem();
```

### `showDialog(dialog: Dialog)`

Показывает `Dialog`.

```ts
currentClientPlatform().showDialog(dialog);
```

Использовать, когда нужен самостоятельный entry-слой поверх страницы без привязки к якорному компоненту.

### `showPopover(anchor: ComponentInstance, popover: Popover)`

Показывает `Popover` относительно якорного инстанса компонента на клиенте.

```ts
currentClientPlatform().showPopover(instance, popover);
```

Использовать, когда нужен локальный всплывающий UI рядом с конкретным элементом. В `onClick` и других server-обработчиках якорь берётся из `instance` (см. `component-instance.md`).

### `showDatePicker(anchor, ref: ContextValueRef<string | undefined>)`

Открывает native date picker и связывает результат с `ref` — ссылка на строковое поле контекста.

```ts
currentClientPlatform().showDatePicker(instance, this.context.ref("birthday"));
```

### `showColorPicker(anchor, ref: ContextValueRef<string | undefined>)`

Открывает native color picker.

```ts
currentClientPlatform().showColorPicker(instance, this.context.ref("color"));
```

### `showTimePicker(anchor, ref: ContextValueRef<string | undefined>)`

Открывает native time picker.

```ts
currentClientPlatform().showTimePicker(instance, this.context.ref("time"));
```

### `showDateTimePicker(anchor, ref: ContextValueRef<string | undefined>)`

Открывает native datetime picker.

```ts
currentClientPlatform().showDateTimePicker(
  instance,
  this.context.ref("meetingAt"),
);
```

### `setOverlays(overlays)`

Устанавливает platform-level overlays.

```ts
currentClientPlatform().setOverlays([
  {
    anchors: [OverlayAnchor.Bottom, OverlayAnchor.Center],
    component: floatingActionComponent,
  },
]);
```

Использовать, когда overlay должен жить на уровне платформы, а не конкретного контейнера или страницы.

### `getOverlays()`

Возвращает текущие platform overlays.

```ts
const overlays = currentClientPlatform().getOverlays();
```

Обычно это вспомогательный метод для серверной логики, которая управляет overlays.

### `enumerateDevices(config)`

Запрашивает у клиента список доступных media devices.

```ts
currentClientPlatform().enumerateDevices({
  onSuccess: (devices) => {
    console.log(devices);
  },
});
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

### `getGeolocation(config)`

Запрашивает геолокацию.

```ts
if (platform instanceof BrowserPlatform) {
  platform.getGeolocation({
    onSuccess: ({ latitude, longitude }) => {
      console.log(latitude, longitude);
    },
  });
}
```

### `addEventToCalendar(data)`

Создает событие в календаре.

```ts
platform.addEventToCalendar({
  start: Date.now(),
  summary: "Встреча",
});
```

### `downloadCsvContent(filename, content)`

Скачивает CSV, сформированный на BFF.

```ts
platform.downloadCsvContent("report", [
  ["Name", "Value"],
  ["Alice", "42"],
]);
```

### `TelegramMiniAppPlatform.downloadFile(url, filename)`

Запускает скачивание файла по URL.

```ts
platform.downloadFile(fileUrl, "report.pdf");
```

### `openFile(url)`

Открывает файл внутри браузерного просмотрщика.

```ts
platform.openFile(fileUrl);
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

### `registerPushNotifications(config)`

Запрашивает разрешение на push и отдает браузерную subscription.

```ts
platform.registerPushNotifications({
  publicKey: "VAPID_PUBLIC_KEY",
  onGranted: (subscription) => {
    console.log(subscription.endpoint);
  },
});
```

### `createWebAuthnCredential(config)` / `getWebAuthnCredential(config)`

WebAuthn (passkeys) только на **Browser** и **PWA** (`BrowserPlatform` / `PwaPlatform`). **Mobile (Capacitor) пока не поддерживается** — методы есть только на BFF-классе `BrowserPlatform`; на клиенте обработчик только в `BrowserPlatform`.

**Общий поток на BFF:**

1. Сгенерировать `optionsJSON` на сервере (`@matreshka/bff/webauthn`) и **сохранить challenge** (сессия, Redis, БД — на ваш выбор).
2. Вызвать метод платформы — клиент покажет системный диалог (Face ID, Windows Hello и т.д.) и вернёт `credentialJSON`.
3. Верифицировать ответ на BFF тем же пакетом и только после `verified: true` считать пользователя зарегистрированным / вошедшим.

**Требования среды:**

| Условие | Зачем |
| -------- | ----- |
| HTTPS (secure context) | Без этого браузер/WebView не вызывает WebAuthn |
| `rpID` = registrable domain | Должен совпадать с доменом страницы (без порта): для `https://app.example.com` обычно `example.com` |
| `expectedOrigin` при verify | Полный origin клиента, например `https://app.example.com` — **не** путать с `rpID` |

#### Как выбрать `rpID` (что именно вводить)

`rpID` — это **домен сайта**, к которому браузер привязывает passkey. Это не URL целиком: **без** `https://`, **без** пути и **без** порта.

**Правило:** возьмите адресную строку, где открыт клиент Matreshka, и оставьте только host. Если host — поддомен публичного домена, для WebAuthn часто используют **effective domain** (registrable domain): один `rpID` на `app.example.com` и `www.example.com` → `example.com`. Если приложение живёт только на одном host и вы хотите изолировать passkeys — можно указать **точный** host как `rpID` (см. таблицу ниже).

| Открыт клиент по адресу | Что писать в `rpID` | `expectedOrigin` при verify |
| ----------------------- | ------------------- | --------------------------- |
| `https://localhost:4200` (локальная разработка) | `localhost` | `https://localhost:4200` |
| `https://127.0.0.1:4200` | `127.0.0.1` (не смешивать с `localhost` — для WebAuthn это разные rpID) | `https://127.0.0.1:4200` |
| `https://app.example.com` | `example.com` или `app.example.com` | `https://app.example.com` |
| `https://example.com` | `example.com` | `https://example.com` |
| `https://my-app.vercel.app` | `my-app.vercel.app` (полный host; общий `vercel.app` для всех нельзя) | `https://my-app.vercel.app` |

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

| Параметр | Назначение |
| -------- | ---------- |
| `optionsJSON` | Объект от `generateRegistrationOptions` или `generateAuthenticationOptions`. Передаётся на клиент как есть; внутри есть одноразовый **challenge**. |
| `onSuccess(credentialJSON)` | JSON-ответ authenticator после успешной церемонии. Его нужно передать в `verifyRegistrationResponse` / `verifyAuthenticationResponse`. |
| `onError?(message)` | Текст ошибки: отмена пользователем, нет поддержки WebAuthn, неверная среда и т.д. |

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

platform.createWebAuthnCredential({
  optionsJSON,
  onSuccess: async (credentialJSON) => {
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
  },
  onError: (message) => {
    // показать пользователю или записать в лог
  },
});
```

**`generateRegistrationOptions` — что означает каждый параметр:**

| Параметр | Обязательность | Смысл |
| -------- | -------------- | ----- |
| `rpName` | да | Человекочитаемое имя сайта/приложения в диалоге authenticator («My App»). |
| `rpID` | да | Идентификатор relying party — домен без схемы и порта. Credential привязывается к нему; при входе `expectedRPID` должен совпадать. |
| `userName` | да | Логин для отображения (часто email). Не секрет; не заменяет проверку на сервере после verify. |
| `userID` | да | Стабильный **байтовый** id пользователя в вашей системе (не email). Должен быть неизменным для одного аккаунта; длина обычно до 64 байт. |
| `userDisplayName` | нет | Имя в UI authenticator («Иван Иванов»). |
| `attestationType` | нет | `"none"` — без attestation (типично для passkeys в вебе). Другие значения — если нужна проверка модели authenticator. |
| `authenticatorSelection.residentKey` | нет | `"preferred"` / `"required"` — discoverable credential (passkey в менеджере паролей); `"discouraged"` — только security key без привязки к аккаунту на устройстве. |
| `authenticatorSelection.userVerification` | нет | `"preferred"` / `"required"` — биометрия/PIN на устройстве; `"discouraged"` — без проверки пользователя (редко для passkeys). |

**Поля в возвращаемом `optionsJSON` (важные для приложения):**

| Поле | Смысл |
| ---- | ----- |
| `challenge` | Одноразовая случайная строка (base64url). **Обязательно** сохранить на сервере и передать в `expectedChallenge` при verify. |
| `rp`, `user`, `pubKeyCredParams`, … | Уходит на клиент внутри `optionsJSON`; менять вручную после генерации не нужно. |

**`verifyRegistrationResponse` — параметры verify:**

| Параметр | Смысл |
| -------- | ----- |
| `response` | Тот же `credentialJSON`, что пришёл в `onSuccess` платформы. |
| `expectedChallenge` | Challenge из шага регистрации (из сохранённого `optionsJSON.challenge`), не из ответа клиента. |
| `expectedOrigin` | Origin, с которого открыт клиент Matreshka (`https://…`). |
| `expectedRPID` | Тот же `rpID`, что при генерации options. |
| `requireUserVerification` | `true` — отклонить ответ без user verification (рекомендуется для passkeys). |

**`verification.registrationInfo` → запись в БД (`StoredWebAuthnCredential`):**

| Поле | Смысл |
| ---- | ----- |
| `credentialID` | Id credential для последующего входа (`allowCredentials`). |
| `credentialPublicKey` | Публичный ключ для проверки подписи при authentication. |
| `counter` | Счётчик использований authenticator; обновлять после каждого успешного входа. |
| `credentialDeviceType` | `"singleDevice"` или `"multiDevice"` (синхронизируемый passkey). |
| `credentialBackedUp` | Был ли credential синхронизирован в облако (iCloud/Google и т.д.). |
| `transports` | Подсказки (`internal`, `hybrid`, …) — опционально для UX. |
| `webauthnUserID` | Ваш `userID` в формате, который вернул authenticator. |

---

#### Вход по passkey (подробный пример)

```ts
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@matreshka/bff/webauthn";

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

platform.getWebAuthnCredential({
  optionsJSON: authOptionsJSON,
  onSuccess: async (credentialJSON) => {
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
      await updateCredentialCounter(userId, verification.authenticationInfo.newCounter);
      await clearPendingChallenge(userId);
      // создать сессию приложения
    }
  },
  onError: (message) => {},
});
```

**`generateAuthenticationOptions`:**

| Параметр | Смысл |
| -------- | ----- |
| `rpID` | Домен relying party — как при регистрации. |
| `allowCredentials` | Список известных credential пользователя. Если пустой/не передан — **discoverable** вход (passkey из списка на устройстве). |
| `allowCredentials[].id` | `credentialID` из БД. |
| `allowCredentials[].transports` | Опционально ускоряет выбор authenticator. |
| `userVerification` | Как при регистрации: `"preferred"` или `"required"`. |

**`verifyAuthenticationResponse` → `credential` (из вашей БД):**

| Поле | Смысл |
| ---- | ----- |
| `id` | Id credential — тот же, что при регистрации. |
| `publicKey` | Публичный ключ из `StoredWebAuthnCredential`. |
| `counter` | Последний известный counter; после verify обновить на `authenticationInfo.newCounter` (защита от replay). |
| `transports` | Опционально, как при регистрации. |

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
platform.downloadFile(fileUrl, "invoice.pdf");
```

### `share(data)`

Шаринг через Telegram Mini App.

```ts
platform.share({
  url: "https://example.com",
  text: "Ссылка",
});
```

### `TelegramMiniAppPlatform.initData(botToken)`

Проверяет и разбирает `initData`, пришедшие от Telegram.

```ts
const initData = platform.initData(process.env.TELEGRAM_BOT_TOKEN!);
```

Это серверный способ получить и провалидировать telegram mini app init payload.

### `TelegramMiniAppPlatform.getGeolocation(config)`

Запрашивает геолокацию внутри Telegram Mini App.

```ts
platform.getGeolocation({
  onSuccess: (position) => {
    console.log(position.latitude);
  },
});
```

### `TelegramMiniAppPlatform.requestContact(config)`

Запрашивает контакт пользователя.

```ts
platform.requestContact({
  onReceive: (data) => {
    console.log(data.phone_number);
  },
  onCancel: () => {
    console.log("Пользователь отменил запрос");
  },
});
```

## Методы `MaxMiniAppPlatform`

`MaxMiniAppPlatform` похож на Telegram Mini App, но с собственным API.

### `MaxMiniAppPlatform.requestContact(config)`

Запрашивает контакт пользователя.

```ts
platform.requestContact({
  onReceive: (data) => {
    console.log(data.phone);
  },
});
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
platform.addEventToCalendar({
  start: Date.now(),
  summary: "Звонок",
});
```

### `MobilePlatform.downloadCsvContent(filename, content)`

Сохраняет CSV на устройство.

```ts
platform.downloadCsvContent("report", [["A", "B"]]);
```

### `MobilePlatform.downloadFile(url, filename)`

Скачивает файл на устройство.

```ts
platform.downloadFile(fileUrl, "document.pdf");
```

### `MobilePlatform.share(data)`

Открывает системный share dialog.

```ts
platform.share({
  text: "Поделиться",
  url: "https://example.com",
});
```

### `MobilePlatform.getGeolocation(config)`

Запрашивает геолокацию на мобильном устройстве.

```ts
platform.getGeolocation({
  onSuccess: ({ latitude, longitude }) => {
    console.log(latitude, longitude);
  },
});
```

### `MobilePlatform.registerPushNotifications(config)`

Запрашивает push token.

```ts
platform.registerPushNotifications({
  onGranted: (token) => {
    console.log(token.value);
  },
});
```

### `MobilePlatform.requestBLEScan(config)`

Запускает BLE scan.

```ts
const stopScan = platform.requestBLEScan({
  onReceive: (result) => {
    console.log(result.device.deviceId);
  },
});
```

Метод возвращает функцию остановки:

```ts
stopScan();
```

### `MobilePlatform.connectToBLEDevice(deviceId)`

Создает объект BLE-устройства и инициирует подключение.

```ts
const device = platform.connectToBLEDevice(deviceId);
```

Дальше можно работать уже с объектом устройства.

## BLEDevice

`connectToBLEDevice()` возвращает `BLEDevice`.

У него есть события:

- `connect$`
- `error$`
- `disconnect$`

И методы:

- `disconnect()`
- `read(serviceId, characteristicId, config)`
- `write(serviceId, characteristicId, value, config)`
- `getServices(config)`

Это уже отдельный под-API поверх мобильной платформы.

Пример:

```ts
const device = platform.connectToBLEDevice(deviceId);

device.connect$.subscribe(() => {
  console.log("Подключено");
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
