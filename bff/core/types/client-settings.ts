import { ColorRole } from "@matreshka/shared/enums/color-role";
import { ColorToken } from "@matreshka/shared/types/color-token";
import { AppFontsConfig } from "@matreshka/shared/types/fonts";

export type ClientSettingsColors = {
  /** Реестр определений токенов для handshake и резолва id в UI. */
  registry: ColorToken[];
  /** Глобальные роли по умолчанию на клиенте. */
  default: Partial<Record<ColorRole, ColorToken>>;
};

/**
 * Настройки интерфейса приложения, передаваемые клиенту.
 *
 * @property appName Название приложения.
 * @property appShortName Короткое название приложения.
 * @property faviconUrl Ссылки на иконки favicon.
 * @property pwaIconUrl Ссылки на иконки для установки как PWA.
 * @property fonts Реестр и стек шрифтов интерфейса.
 * @property colors Реестр токенов и глобальные роли по умолчанию.
 */
export type ClientSettings = {
  appName: string;
  appShortName?: string;
  analytics?: {
    yandex?: {
      id: string;
    };
  };
  faviconUrl?: {
    png: string; // Рекомендуется 180x180
    svg?: string;
  };
  pwaIconUrl?: {
    // Не используйте прозрачный фон, иначе ОС может подставить белый фон
    png: string;
    svg?: string;
  };
  fonts: AppFontsConfig;
  colors: ClientSettingsColors;
};
