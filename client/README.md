# Matreshka Client

Универсальный Angular runtime Matreshka (проект Delta). Логику UI описывают на BFF — см. [документацию](../docs/getting-started/local-setup.md).

## Разработка

```bash
ng serve
# или с автоматическим открытием браузера
ng serve --open
```

## Сборка

```bash
ng build
```

## Сборка и разработка под платформы

Приложение поддерживает несколько платформ. Каждая платформа собирается отдельно — в бандл попадает только код нужной платформы, что уменьшает размер приложения.

### Доступные платформы

| Платформа         | Конфигурация |
| ----------------- | ------------ |
| Browser           | `browser`    |
| Android           | `android`    |
| iOS               | `ios`        |
| Telegram Mini App | `telegram`   |
| MAX Mini App      | `max`        |

### Режимы сборки

Для каждой платформы доступны два режима:

- **development** — без оптимизации, с source maps (по умолчанию для `ng serve`)
- **production** — оптимизация, минификация, хеши в именах файлов

Конфигурации объединяются через запятую: `платформа,режим`.

### Команды

```bash
# Разработка под платформу (development режим)
ng serve --configuration=browser
ng serve --configuration=android
ng serve --configuration=ios
ng serve --configuration=telegram
ng serve --configuration=max

# Production-сборка под платформу
ng build --configuration=browser,production
ng build --configuration=android,production
ng build --configuration=ios,production
# и т.д.

# Production-сборка с SSR (browser + server-side rendering)
ng build --configuration=browser,production,ssr

# Development-сборка (для отладки)
ng build --configuration=android,development
```

### По умолчанию

Без указания конфигурации используется `browser`. Файл `platform-provider.ts` реэкспортирует провайдер из `browser.platform-provider.ts`.

### Service Worker (PWA)

Service Worker включается только для платформ `browser` — там, где приложение работает как PWA. Для других платформ он не используется.
