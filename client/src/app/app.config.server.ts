import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import ws from 'ws';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { PLATFORM } from './platforms/platform';
import { ServerPlatform } from './platforms/server-platform';
import { EnvironmentService } from './services/environment.service';
import { ServerSideEnvironmentService } from './services/server-side-environment.service';
import { EVENT_SOURCE } from './tokens/event-source';
import { WEB_SOCKET } from './tokens/web-socket';
const EventSourceModule = require('launchdarkly-eventsource');

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: EnvironmentService,
      useExisting: ServerSideEnvironmentService,
    },
    {
      provide: WEB_SOCKET,
      useValue: ws,
    },
    {
      provide: PLATFORM,
      useClass: ServerPlatform,
    },
    {
      provide: EVENT_SOURCE,
      useValue: EventSourceModule.EventSource,
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
