import { PlatformId } from '@matreshka/client-bff-protocol/enums/platform-id';
import { MobilePlatform } from './mobile-platform';

export class AndroidPlatform extends MobilePlatform {
  id(): PlatformId {
    return PlatformId.Android;
  }
}
