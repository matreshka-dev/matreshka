import { HttpClient } from '@angular/common/http';
import { DOCUMENT, inject, Injectable } from '@angular/core';
import { switchMap } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { WINDOW } from '../tokens/window';
import { SourceConfig } from '../types/source-config';
import { loadScript } from '../utils/load-script';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  http = inject(HttpClient);
  config!: { source: SourceConfig; debug: boolean };
  window = inject(WINDOW);
  document = inject(DOCUMENT);
  constructor() {}

  initConfig() {
    return this.http.get('assets/config.json?t=' + Math.random()).pipe(
      switchMap((config) => {
        this.config = config as any;
        return fromPromise(
          new Promise<void>((resolve) => {
            if (this.debug()) {
              console.log('Loading eruda...');
              loadScript(
                this.document,
                'https://cdn.jsdelivr.net/npm/eruda',
              ).then(() => {
                console.log('Init eruda...');
                (this.window as any).eruda.init();
                resolve();
              });
            } else {
              resolve();
            }
          }),
        );
      }),
    );
  }

  source() {
    return this.config.source;
  }

  debug() {
    return this.config.debug;
  }
}
