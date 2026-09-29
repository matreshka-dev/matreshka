import { inject, PLATFORM_ID } from '@angular/core';
import { PlatformId } from '@shared/enums/platform-id';
import { Platform } from './platform';

export class ServerPlatform extends Platform {
  storage = {
    setItem: () => {
      throw new Error('Storage not supported by server platform');
    },
    values: () => {
      return {};
    },
    getItem: () => {
      throw new Error('Storage not supported by server platform');
    },
  };
  platformId = inject(PLATFORM_ID);
  override id(): PlatformId {
    return PlatformId.Server;
  }

  override payload(): Record<string, unknown> {
    return {};
  }

  override language(): Promise<string> {
    return Promise.resolve('');
  }

  override storageValues(): Record<string, string> {
    return {};
  }

  override openExternalLink(url: string) {
    throw new Error('Opening links not supported by server platform');
  }
}
