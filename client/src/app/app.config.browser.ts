import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { appConfig } from './app.config';
import { EVENT_SOURCE } from './tokens/event-source';
import { WEB_SOCKET } from './tokens/web-socket';

const browserConfig: ApplicationConfig = {
  providers: [
    {
      provide: WEB_SOCKET,
      useValue: WebSocket,
    },
    {
      provide: EVENT_SOURCE,
      useValue: EventSource,
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, browserConfig);
