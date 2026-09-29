import { IosPlatform } from './platforms/ios-platform';
import { PLATFORM } from './platforms/platform';

export const platformProvider = {
  provide: PLATFORM,
  useClass: IosPlatform,
};
