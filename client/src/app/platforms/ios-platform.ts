import { PlatformId } from '@shared/enums/platform-id';
import { MobilePlatform } from './mobile-platform';

export class IosPlatform extends MobilePlatform {
  id(): PlatformId {
    return PlatformId.Ios;
  }
}
