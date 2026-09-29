import { PLATFORM } from './platforms/platform';
import { TelegramMiniAppPlatform } from './platforms/telegram-mini-app-platform';

export const platformProvider = {
  provide: PLATFORM,
  useClass: TelegramMiniAppPlatform,
};
