import { AndroidPlatform } from './platforms/android-platform';
import { PLATFORM } from './platforms/platform';

export const platformProvider = {
  provide: PLATFORM,
  useClass: AndroidPlatform,
};
