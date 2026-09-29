import { MaxMiniAppPlatform } from './platforms/max-mini-app-platform';
import { PLATFORM } from './platforms/platform';

export const platformProvider = {
  provide: PLATFORM,
  useClass: MaxMiniAppPlatform,
};
