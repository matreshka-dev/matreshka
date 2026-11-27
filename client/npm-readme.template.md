# {{PACKAGE_NAME}}

Production-бандл универсального Angular-клиента Matreshka для платформы **{{PLATFORM}}**.

Пакет содержит **статику** (HTML/JS/CSS), а не библиотеку для `import`. Её нужно скопировать в каталог раздачи вашего проекта и положить свой runtime-конфиг.

## Быстрый старт

```bash
npm install {{PACKAGE_NAME}}
```

1. Скопируйте содержимое пакета в каталог, который отдаёт ваш static server (например `public/`).
2. Положите свой `assets/config.json` (в пакете только `assets/config.*.example.json`).
3. Раздайте каталог (`http-server`, nginx и т.п.).

Пример sync-скрипта и полный разбор — в документации:

https://github.com/matreshka-dev/matreshka/blob/main/docs/getting-started/client-from-npm.md

Совместимость с BFF по protocol (dist-tag `client-bff-protocol-<ver>`):

https://github.com/matreshka-dev/matreshka/blob/main/docs/getting-started/updating.md

## config.json

Клиент в рантайме запрашивает `assets/config.json` с origin раздачи. Файл должен лежать **в вашем проекте** (не правьте `node_modules`).

WebSocket:

```json
{
  "source": {
    "type": "ws",
    "params": { "url": "ws://127.0.0.1:3001" }
  },
  "debug": false
}
```

SSE (GET = EventSource, POST = исходящие сообщения на тот же URL):

```json
{
  "source": {
    "type": "sse",
    "params": { "url": "https://127.0.0.1:3001/sse" }
  },
  "debug": false
}
```

После обновления версии пакета снова выполните sync (или повесьте его на `postinstall` в своём проекте), иначе на раздаче останется старый бандл.
