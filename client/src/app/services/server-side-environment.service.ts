import { Injectable } from '@angular/core';
import fs from 'fs/promises';
import path from 'path';
import { map, Observable } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { EnvironmentService } from './environment.service';

@Injectable({
  providedIn: 'root',
})
export class ServerSideEnvironmentService extends EnvironmentService {
  override initConfig(): Observable<void> {
    const filename = path.join(process.cwd(), 'src/assets/config.json');
    return fromPromise(fs.readFile(filename)).pipe(
      map((config) => {
        this.config = JSON.parse(config.toString());
        return;
      }),
    );
  }
}
