import { InjectionToken } from '@angular/core';

export const EVENT_SOURCE = new InjectionToken<typeof EventSource>(
  'Подключение SSE для SSR',
);
