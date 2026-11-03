import { inject, Injectable, isDevMode } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { filter, firstValueFrom } from 'rxjs';
import { clientBffProtocolVersion } from '../client-bff-protocol-version';
import { WINDOW } from '../tokens/window';

const PROTOCOL_VERSION_SKEW_ALERT =
  'Версия протокола приложения не совпадает с сервером, а обновление клиента недоступно. ' +
  `Клиент: ${clientBffProtocolVersion}. Обновите страницу вручную или обратитесь к администратору.`;

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
      void this.updates.checkForUpdate();
    }
  }

  /** Расхождение protocolVersion в handshake: сначала SW, иначе alert. */
  async handleProtocolVersionSkew(
    serverProtocolVersion: string,
  ): Promise<void> {
    if (isDevMode() || !this.updates.isEnabled) {
      this.window.alert(
        `${PROTOCOL_VERSION_SKEW_ALERT} Сервер: ${serverProtocolVersion}.`,
      );
      return;
    }

    const updateAvailable = await this.updates.checkForUpdate();
    if (!updateAvailable) {
      this.window.alert(
        `${PROTOCOL_VERSION_SKEW_ALERT} Сервер: ${serverProtocolVersion}.`,
      );
      return;
    }

    const evt = await firstValueFrom(
      this.updates.versionUpdates.pipe(
        filter(
          (event): event is VersionEvent =>
            event.type === 'VERSION_READY' ||
            event.type === 'VERSION_INSTALLATION_FAILED',
        ),
      ),
    );
    if (evt.type === 'VERSION_INSTALLATION_FAILED') {
      this.window.alert(
        `${PROTOCOL_VERSION_SKEW_ALERT} Сервер: ${serverProtocolVersion}.`,
      );
    }
  }
}
