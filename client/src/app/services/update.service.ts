import { inject, Injectable, isDevMode } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { WINDOW } from '../tokens/window';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private updates = inject(SwUpdate);
  private window = inject(WINDOW);
  constructor() {
    this.updates.versionUpdates.subscribe((evt) => {
      switch (evt.type) {
        case 'VERSION_DETECTED':
          console.log(`Downloading new app version: ${evt.version.hash}`);
          break;
        case 'VERSION_READY':
          console.log(`Current app version: ${evt.currentVersion.hash}`);
          console.log(
            `New app version ready for use: ${evt.latestVersion.hash}`,
          );
          this.window.location.reload();
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.log(
            `Failed to install app version '${evt.version.hash}': ${evt.error}`,
          );
          break;
      }
    });
  }
  checkForUpdate() {
    if (!isDevMode()) {
      this.updates.checkForUpdate();
    }
  }
}
