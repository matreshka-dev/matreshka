# Политика версий пакетов

Semver для каждого пакета монорепозитория Matreshka. Номера **не обязаны совпадать** между пакетами; в рантайме клиент и BFF сверяют только строку `protocolVersion` из `@matreshka/client-bff-protocol` (см. [Протокол](../architecture/protocol.md#handshake)).

## Пакеты

| Пакет                             | npm           | Роль                                           |
| --------------------------------- | ------------- | ---------------------------------------------- |
| `@matreshka/client`               | нет (private) | Универсальный Angular-клиент, PWA / Capacitor  |
| `@matreshka/bff`                  | да            | Runtime и DSL на сервере                       |
| `@matreshka/client-bff-protocol`  | да            | Связь client ↔ BFF                            |
| `@matreshka/gateway-bff-protocol` | да            | Связь gateway ↔ BFF                           |
| `@matreshka/shared`               | да            | Утилиты рантайма (часто транзитивно через BFF) |
| `@matreshka/gateway`              | да            | Релей клиентов к BFF                           |

## Semver по пакету

- **patch** — исправление без смены контракта для текущих вызовов и того же JSON на проводе.
- **minor** — новое поведение или API; старые вызовы и старый JSON остаются рабочими.
- **major** — ломающее изменение: удаление, переименование, новые обязательные поля, иное поведение при тех же вызовах.

Пока major = 0, диапазон npm `^0.Y.Z` принимает только патчи той же minor (`^0.26.0` → `>=0.26.0 <0.27.0`). Minor и major потребитель обновляет явно.

**Не поднимать** версию за правки docs, тестов, форматирования и внутреннего рефакторинга без изменения публичного поведения и типов.

`@matreshka/client`: версия в `client/package.json` — метка поставки приложения; PWA дополнительно опирается на хэш бандла в Service Worker. Поднимайте её при каждой выкладке клиента.

## Зависимости

```text
client ──► client-bff-protocol, shared
shared ──► client-bff-protocol
bff ──► client-bff-protocol, gateway-bff-protocol, shared
gateway ──► client-bff-protocol
```

Gateway разбирает только client/BFF handshake (`applicationId`, reconnect `token`) и пересылает остальные сообщения. Версия `@matreshka/bff`, которую gateway сохраняет при `connectBff`, **не** участвует в проверке совместимости с клиентом.

## Каскад при релизе

1. Поднимите версию пакета, чей контракт изменился.
2. Соседние пакеты — только если:
   - изменился **их** публичный контракт;
   - новая зависимость вышла за их `^` (например protocol `0.1.x` → `0.2.0`);
   - нужна **одна строка** `@matreshka/client-bff-protocol` у клиента и задеплоенного BFF.

**protocolVersion:** любой bump `@matreshka/client-bff-protocol`, включая patch, меняет строку в handshake. При расхождении клиент не применяет settings (PWA пробует обновление SW, иначе alert). Protocol, клиент и процесс BFF с этим protocol выпускайте **вместе** на одной версии protocol. Версии `@matreshka/client` и `@matreshka/bff` при этом могут отличаться.

Patch protocol в линейке `0.1.x` обычно **не** требует новых версий gateway и shared: `^0.1.0` их подхватит, код не менялся. Исключение — правка полей handshake, которые gateway парсит сам.

Смена JSON-обёртки сообщений (`type`, `payload` и т.п.) — **major в обоих** protocol-пакетах в одном релизе; см. README `@matreshka/client-bff-protocol` и `@matreshka/gateway-bff-protocol`.

## Таблица: что менялось → bump

Уровни: **P** patch, **M** minor, **X** major, **—** не трогать, **△** поставка/деплой без npm (клиент или обновление зависимости в приложении BFF).

| Изменение                                                                 | client  | client-bff-protocol | gateway-bff-protocol | shared | bff   | gateway |
| ------------------------------------------------------------------------- | ------- | ------------------- | -------------------- | ------ | ----- | ------- |
| Только docs / тесты / рефакторинг без публичного API                      | —       | —                   | —                    | —      | —     | —       |
| Баг только в UI клиента, провод без изменений                             | P       | —                   | —                    | —      | —     | —       |
| Новый необязательный prop DSL / метод BFF, провод тот же                  | —       | —                   | —                    | —      | M     | —       |
| Новый тип сообщения client ↔ BFF (старые клиенты игнорируют или не шлют) | △       | M                   | —                    | M\*    | M     | —       |
| Новый server-компонент, клиент ещё не умеет рисовать                      | △       | M                   | —                    | M\*    | M     | —       |
| Баг сериализации JSON без новой формы                                     | △       | P                   | —                    | P\*    | △\*\* | —       |
| Ломающий экспорт `@matreshka/shared`                                      | △\*\*\* | —                   | —                    | X      | M/X   | —       |
| Новое служебное сообщение gateway ↔ BFF                                  | —       | —                   | M                    | —      | M     | M       |
| Ломающее сообщение или поле client ↔ BFF                                 | △       | X                   | X†                   | M/X    | M/X   | △‡      |
| Правка полей handshake, которые читает gateway                            | △       | P/M                 | —                    | —      | △     | P/M     |
| Смена JSON-обёртки (`Message`, registry)                                  | △       | X                   | X                    | M/X    | M/X   | M       |

\* shared — только если менялись типы/утилиты в shared, используемые на проводе.

\*\* bff — bump npm только если менялся код `@matreshka/bff`; иначе приложение обновляет `@matreshka/client-bff-protocol` и перезапускается.

\*\*\* client — только если приложение импортирует shared напрямую; иначе достаточно обновить `@matreshka/bff`.

† major gateway-bff-protocol только если затронут общий конверт; иначе minor gateway-bff-protocol.

‡ gateway — если сломан парсинг client handshake или нужна новая зависимость protocol.

## Примеры

### 1. Новый необязательный аргумент в DSL

Добавили опциональный параметр у `Stack`, JSON страницы не менялся.

- `@matreshka/bff` **minor**
- client, protocol, shared, gateway — **—**

### 2. Исправление сериализации без новой формы JSON

Неверно кодировалось необязательное поле в существующем сообщении.

- `@matreshka/client-bff-protocol` **patch**
- `@matreshka/client` **patch** и выкладка вместе с BFF на той же строке protocol
- `@matreshka/bff` npm **—**, если runtime не менялся; в `package.json` приложения — новый patch protocol и redeploy
- `@matreshka/shared` **patch**, только если правка была в shared

### 3. Удалён тип сообщения или обязательное поле payload

- `@matreshka/client-bff-protocol` **major**
- `@matreshka/gateway-bff-protocol` **major**, если менялся общий конверт
- `@matreshka/bff` **major**, если ломается публичный DSL; иначе **minor** из‑за нового диапазона `^0.(n+1).0` на protocol
- `@matreshka/client` — поставка с той же версией protocol
- `@matreshka/gateway` — **—** или **minor**, если обновили парсинг handshake / зависимость protocol

## Для прикладного BFF

В `package.json` держите `@matreshka/client-bff-protocol` в одной линейке с задеплоенным универсальным клиентом. Версию `@matreshka/bff` можно обновлять отдельно, пока не меняется строка protocol и не ломается ваш код на новом API.

Контрибьюторам: корневая сборка `npm run build`, публикация — `prepublish:packages` в корне; см. [AGENTS.md](../../AGENTS.md).
