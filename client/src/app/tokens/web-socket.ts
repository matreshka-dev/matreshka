import { InjectionToken } from '@angular/core';

export const WEB_SOCKET = new InjectionToken<typeof WebSocket>(
  'Подключение WS для SSR',
);
