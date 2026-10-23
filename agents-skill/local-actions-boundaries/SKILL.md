---
name: local-actions-boundaries
description: Defines the boundary between Matreshka LocalAction and server handlers. Use when adding or reviewing dialog, popover, button, form, or entry interactions, especially when replacing server component commands with local actions.
---

# Matreshka LocalAction и серверные обработчики

## Основное правило

`LocalAction` передаётся непосредственно в реакцию на событие и выполняется
клиентом. Не вызывай `component.local.*` или `instance.local.*` внутри тела
серверного обработчика.

Серверный обработчик — callback, который выполняется на BFF:

```ts
onClick: () => {
  // код выполняется на BFF
};
```

## Локальное действие

Если взаимодействие меняет только UI, передавай action напрямую:

```ts
button(
  {
    onClick: dialog.local.close(),
  },
  [text("Закрыть")],
);
```

Для одного DOM-инстанса используй `instance.local.close()`, для всех активных
инстансов компонента — `component.local.close()`.

Не вызывай local action внутри серверного callback:

```ts
onClick: () => {
  dialog.local.close();
};
```

## Серверная логика и закрытие

Если обработчик выполняет серверную работу — сохранение, очистку контекста,
проверку, навигацию или вызов доменной логики — эта работа остаётся в серверном
обработчике.

Используй серверную команду, если закрытие является частью серверного сценария:

```ts
onClick: () => {
  saveChanges();
  dialog.close();
};
```

Если API поддерживает массив действий, серверную и локальную части объявляй
рядом, а не вкладывай local action в серверный callback:

```ts
onClick: [() => clearErrors(), dialog.local.close()];
```

Порядок действий должен соответствовать сценарию. Не закрывай entry до
обязательной серверной операции, если ошибка операции должна оставить entry
открытым.

## Проверка

- [ ] LocalAction находится непосредственно в свойстве события или массиве actions.
- [ ] Внутри server callback нет вызова `*.local.*`.
- [ ] Серверные операции и проверки остались серверными.
- [ ] В derived-конструкторе `this` не используется до `super()`.
- [ ] Для dialog/popover выбран правильный target: component или instance.
- [ ] Проверены TypeScript и lint изменённых файлов.
