import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { AppPageMessage } from '@client-bff-protocol/messages/bff-to-client/app';
import type { PageConfig } from '@client-bff-protocol/types/page-config';
import { filter, map } from 'rxjs';
import { PostmanService } from '../services/postman.service';

export const routeResolver: ResolveFn<PageConfig> = (route, state) => {
  const postman = inject(PostmanService);
  return postman.incomingMessage$.pipe(
    filter(
      (message): message is AppPageMessage => message instanceof AppPageMessage,
    ),
    map((message) => message.payload),
  );
};
