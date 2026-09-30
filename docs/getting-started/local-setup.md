# Локальная настройка

**Цель:** подключить `@matreshka/bff` к своему Node-проекту и (по желанию) запустить универсальный клиент для проверки UI.

**Предпосылки:** Node.js и npm, прочитан [Обзор](overview.md).

## 1. Зависимости BFF (npm)

В **своём** BFF-проекте:

```bash
npm install @matreshka/bff @matreshka/shared
```

Сборка пакетов из репозитория Matreshka не нужна — версии берутся с npm.

Готового runnable BFF в npm нет: вы создаёте свой Node-проект с WebSocket/SSE transport. Пример — в [Первое приложение](first-app.md).

### Разработка runtime Matreshka (опционально)

Если вы клонировали монорепозиторий и меняете `@matreshka/*` в исходниках, из корня репозитория:

```bash
npm install
npm run build
```

## 2. Клиент Angular (для локальной проверки)

```bash
cd client
npm install
```

Скопируйте пример конфигурации transport:

```bash
cp src/assets/config.ws.example.json src/assets/config.json
```

Отредактируйте URL BFF. Для локального WebSocket без TLS обычно подходит:

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

Запуск:

```bash
ng serve
```

Откройте приложение в браузере (по умолчанию `http://localhost:4200`).

### applicationId

Клиент отправляет в handshake поле `applicationId` (для браузера это обычно `location.host`, например `localhost:4200`). Если позже используете gateway, этот id должен быть в `applicationIds` нужного BFF в конфиге gateway.

## 3. Порядок запуска для проверки

1. Запустите ваш BFF с WebSocket на порту из `config.json` (например `3001`).
2. Запустите `ng serve` в `client/`.
3. Откройте клиент в браузере — после handshake BFF отправит страницу для текущего route.

## Ожидаемый результат

Клиент собран, конфиг указывает на ваш BFF, вы готовы подключить transport по инструкции из следующей главы.

## Что дальше

**Следующий обязательный шаг:** [Первое приложение](first-app.md) — код BFF и
transport.

Дополнительно: [client/README.md](../../client/README.md) — платформы и
production-сборки клиента.
