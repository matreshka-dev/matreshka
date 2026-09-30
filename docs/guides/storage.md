# Storage

`storage` — это клиентское key-value хранилище, которое клиент передает в BFF как часть `ClientState`.

Оно полезно для небольших значений, которые должны жить между сессиями и использоваться серверной логикой:

- auth token или JWT;
- выбранный tenant или organization id;
- флаги onboarding;
- пользовательские настройки, которые нужны до построения страницы.

## Где живет storage

Storage хранится на стороне клиента, а BFF получает его актуальный snapshot в сообщении `client-state`.

Фрагмент payload:

```json
{
  "route": {
    "visitedAt": 1719240000000,
    "path": "/profile",
    "query": {}
  },
  "storage": {
    "jwt": "token-value"
  }
}
```

На разных платформах физическое хранилище отличается:

- web-клиент хранит значения в `localStorage`;
- mobile-клиент хранит значения через platform preferences;
- Telegram Mini App использует `DeviceStorage`, если он доступен, иначе fallback в `localStorage`;
- server platform не поддерживает persistent storage и отдает пустой объект.

Для BFF это остается одним и тем же интерфейсом: `client.state$.getValue().storage`.

## Чем storage отличается от `Context`

`Context` — это серверное состояние конкретного UI-сценария: формы, списка, страницы или виджета. Оно связано с lifecycle страницы и синхронизацией UI.

`storage` — это клиентское состояние, которое приходит вместе с `ClientState`. Его удобно использовать для данных, которые нужны до создания страницы или должны сохраниться между сессиями клиента.

Практическое правило:

- используйте `Context`, если значение является состоянием текущего UI;
- используйте `storage`, если значение принадлежит клиенту и должно быть доступно при следующем route/reload.

## Чтение storage на BFF

В route handler storage доступен через `Client`:

```ts
app.router.addPage("/admin", async (client) => {
  const jwt = client.getStorageValue("jwt");
  const session = await authService.findSessionByJwt(jwt);

  return session?.role === "admin" ? new AdminPage() : undefined;
});
```

То же значение можно прочитать напрямую из `ClientState`:

```ts
const jwt = client.state$.getValue().storage.jwt;
```

Метод `getStorageValue(...)` удобнее, когда нужно не привязываться к форме объекта напрямую.

## Запись storage с BFF

BFF может попросить клиента сохранить значение:

```ts
client.setStorageValue("jwt", token);
```

После этого matreshka:

1. обновляет `client.state$` на BFF;
2. отправляет клиенту сообщение `storage-value`;
3. клиент сохраняет значение в своем platform storage.

Удаление значения выглядит так:

```ts
client.clearStorageValue("jwt");
```

## Что хранить

Storage лучше держать маленьким и строковым. Если нужно сохранить структурированные данные, сериализуйте их явно:

```ts
client.setStorageValue(
  "filters",
  JSON.stringify({ status: "active", sort: "createdAt" }),
);
```

А при чтении разбирайте значение там, где оно реально нужно:

```ts
const rawFilters = client.getStorageValue("filters");
const filters = rawFilters ? JSON.parse(rawFilters) : undefined;
```

## Ограничения

- Не храните в storage большие данные, списки компонентов или server-only state.
- Не воспринимайте storage как защищенное хранилище: клиент может изменить его вручную.
- Проверяйте критичные значения на BFF, особенно auth token, роли и доступы.
- Учитывайте, что server platform не имеет persistent storage.

## Что читать дальше

**Следующий обязательный шаг:** [Context](context.md) — серверное состояние
UI-сценария и его отличие от клиентского storage.

Дополнительно: [Client settings](../reference/client-settings.md) — глобальная
конфигурация приложения.
