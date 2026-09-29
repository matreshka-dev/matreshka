import { InjectionToken, Type } from '@angular/core';
import { ServerComponent } from './server-component';
import type {
  ComponentDependencies,
  ServerComponentConfig,
} from './server-component-config';

export const SERVER_COMPONENTS = new InjectionToken<
  Record<
    string,
    {
      component: Type<ServerComponent<ServerComponentConfig>>;

      /**
       * Описание зависимостей компонента:
       * pathsWithPlaceholdersInTemplate — массив путей внутри `config.properties`, которые могут содержать плейсхолдеры для подстановки значений.
       * pathsWithPlaceholdersInCode — массив путей внутри `config.properties`, которые могут содержать плейсхолдеры для подстановки значений в коде компонента.
       * requiredContextsPaths — массив путей к контекстам и путям внутри контекста, которые необходимы для корректной работы компонента.
       * getNestedConfigsPaths — функция, которая возвращает массив путей к вложенным конфигурациям компонента.
       */
      dependencies: ComponentDependencies;
    }
  >
>('Some description');
