# Клиент из npm

**Цель:** поставить готовый production-бандл клиента из npm, настроить `config.json` и раздавать статику без сборки Angular из исходников.

## Пакеты по платформам

| Пакет                        | Платформа                      |
| ---------------------------- | ------------------------------ |
| `@matreshka/client-browser`  | Browser / PWA                  |
| `@matreshka/client-android`  | Android (Capacitor web assets) |
| `@matreshka/client-ios`      | iOS (Capacitor web assets)     |
| `@matreshka/client-telegram` | Telegram Mini App              |
| `@matreshka/client-max`      | MAX Mini App                   |

Версия у всех одна — из `client/package.json` при публикации. Совместимость с BFF по строке `@matreshka/client-bff-protocol` (dist-tag `client-bff-protocol-<ver>` на client-пакетах и на `@matreshka/bff`) — см. [политику версий](../reference/versioning.md).

Пакет — **статика**, не JS-библиотека: его не импортируют в код, а копируют в каталог раздачи.

## Структура проекта-потребителя

```text
package.json
matreshka.config.json          # ваш runtime-конфиг (в git)
scripts/sync-matreshka-client.mjs
public/                        # то, что отдаёт http-server / nginx
```

`matreshka.config.json` не храните в `node_modules`: при `npm update` он затрётся.

## Установка и sync

Скрипт `scripts/sync-matreshka-client.mjs` (подставьте нужный platform-пакет):

```js
import { cp, mkdir } from "node:fs/promises";

const pkg = "node_modules/@matreshka/client-browser";
const out = "public";

await mkdir(out, { recursive: true });
await cp(pkg, out, { recursive: true });
await cp("matreshka.config.json", `${out}/assets/config.json`);
```

Один автоматический sync — через `postinstall` в **вашем** проекте (в `@matreshka/client-*` его нет: пакет не знает каталог раздачи):

```json
{
  "scripts": {
    "sync:client": "node scripts/sync-matreshka-client.mjs",
    "postinstall": "npm run sync:client",
    "start:client": "npx http-server public -p 8080"
  }
}
```

```bash
npm install @matreshka/client-browser
```

После `npm install` / смены версии пакета `postinstall` сам обновит `public/`. Вручную `npm run sync:client` — только если правили `matreshka.config.json` без переустановки зависимостей или в CI без lifecycle-скриптов.

## Установка под версию контракта BFF

Клиент и BFF должны использовать одну версию контракта (пакет `@matreshka/client-bff-protocol`, поле `protocolVersion` в handshake). При публикации на оба пакета вешается dist-tag `client-bff-protocol-<ver>` — полный порядок обновления в [Обновление пакетов](updating.md).

Узнать версию контракта у своего BFF:

```bash
npm ls @matreshka/client-bff-protocol
# или
node -p "require('@matreshka/bff/package.json').dependencies['@matreshka/client-bff-protocol']"
```

Поставить клиент под ту же версию контракта (пример `0.8.0`):

```bash
npm install @matreshka/client-browser@client-bff-protocol-0.8.0
```

Какой semver клиента за тегом:

```bash
npm view @matreshka/client-browser@client-bff-protocol-0.8.0 version
```

## config.json

Клиент запрашивает `GET /assets/config.json` с origin раздачи (не из `node_modules`). В tarball пакета `config.json` **нет** — только примеры `assets/config.ws.example.json` и `assets/config.sse.example.json`.

WebSocket:

```json
{
  "source": {
    "type": "ws",
    "params": {
      "url": "ws://127.0.0.1:3001"
    }
  },
  "debug": false
}
```

SSE — один URL: браузер открывает EventSource (GET), исходящие сообщения уходят POST на тот же путь:

```json
{
  "source": {
    "type": "sse",
    "params": {
      "url": "https://127.0.0.1:3001/sse"
    }
  },
  "debug": false
}
```

Скопируйте пример в корень проекта как `matreshka.config.json` и поправьте URL под свой BFF:

```bash
cp node_modules/@matreshka/client-browser/assets/config.ws.example.json matreshka.config.json
```

## Раздача

```bash
npm run start:client
```

Или любой static host / nginx с `root` на `public/`. Отдельный nginx для overlay не обязателен: sync уже кладёт ваш `config.json` в `public/assets/config.json`.

## Ожидаемый результат

В `public/` лежит актуальный бандл выбранной платформы, `public/assets/config.json` указывает на ваш BFF, static server отдаёт клиент.

## Что дальше

- BFF и handshake: [Первое приложение](first-app.md)
- Совместный апдейт BFF + клиент: [Обновление пакетов](updating.md)
- Локальная разработка клиента из исходников: [Локальная настройка](local-setup.md)
- Версии и контракт: [Политика версий](../reference/versioning.md)
