import { PlatformId } from '@shared/enums/platform-id';
import { Platform } from '../platform';

export class TestPlatform extends Platform {
  storage: Record<string, unknown> = {};

  id(): PlatformId {
    return PlatformId.TestPlatform;
  }

  override async boot(): Promise<this> {
    return this;
  }

  payload(): Record<string, unknown> {
    return {};
  }

  async language(): Promise<string> {
    return 'en';
  }

  storageValues(): Record<string, string> {
    return {};
  }

  openExternalLink(_url: string): void {
    // no-op в тестовой реализации
  }
}
