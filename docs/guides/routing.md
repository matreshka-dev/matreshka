# Роутинг

Этот раздел описывает, как BFF сопоставляет route клиента со страницей и как использовать `Router` в прикладном коде.

## Общая идея

`Router` сопоставляет route mask с callback, который возвращает `Page`.

Matreshka сама следит за `client-state`: когда клиент сообщает текущий route, BFF находит подходящую страницу, выполняет ее подготовку и отправляет клиенту `AppPageMessage`.

## Статическая страница

```ts
app.router.addPage("/users", async () => new UsersPage());
```

Такой route подходит для экранов без параметров: главной страницы, списка, настроек или фиксированного раздела.

## Route с параметром

```ts
app.router.addPage("/users/{id}", async (_client, params) => {
  return new UserPage(params.id);
});
```

`params.id` извлекается из path автоматически.

## Wildcard route

```ts
app.router.addPage("/docs/*", async () => new DocsSectionPage());
app.router.addPage("**", async () => new NotFoundPage());
```

`*` удобно использовать для группы вложенных routes, а `**` — как общий fallback или 404.

## Guard через возврат `undefined`

Callback может вернуть `undefined`. В этом случае `Router` продолжит искать следующий подходящий handler.

```ts
async function getRoleFromJwt(jwt?: string) {
  if (!jwt) {
    return undefined;
  }

  const session = await authService.findSessionByJwt(jwt);
  return session?.role;
}

app.router.addPage("/admin", async (client) => {
  const jwt = client.state$.getValue().storage.jwt;
  const role = await getRoleFromJwt(jwt);

  return role === "admin" ? new AdminPage() : undefined;
});

app.router.addPage("**", async () => new ForbiddenPage());
```

Такой guard полезен, когда решение о доступе должно приниматься на BFF: например, по JWT, роли пользователя, feature flag или состоянию backend-сервиса. Подробнее про клиентское хранилище, из которого читается `storage.jwt`, см. в [`storage.md`](storage.md).

## Что читать дальше

**Следующий обязательный шаг:** [Storage](storage.md) — откуда берутся
`ClientState.storage` и значения для route guards.

Дополнительно: [Client settings](../reference/client-settings.md) — полная
глобальная конфигурация клиентского приложения.
