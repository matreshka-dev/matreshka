import { BrowserPlatform } from './platforms/browser-platform';
import { PLATFORM } from './platforms/platform';

export const platformProvider = {
  provide: PLATFORM,
  useClass: BrowserPlatform,
};
