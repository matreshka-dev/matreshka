import { InjectionToken, Type } from '@angular/core';

/**
 * DI-токен для компонента списка server-компонент.
 *
 * Не импортируем сам `ServerComponentsListComponent` здесь, чтобы не создавать
 * циклические ES-module зависимости. Конкретный компонент задаётся на уровне
 * `app.config.ts` (или в тестах).
 */
export const SERVER_COMPONENTS_LIST_COMPONENT = new InjectionToken<
  Type<unknown>
>('SERVER_COMPONENTS_LIST_COMPONENT');
