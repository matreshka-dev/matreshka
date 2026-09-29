import { ClientPlatform } from "./client-platform";

/**
 * Абстрактный класс платформы для веб-клиента.
 *
 * Расширяет `ClientPlatform` и служит основой для браузерных платформ,
 * включая обычный веб-клиент, PWA и Telegram Mini App.
 */
export abstract class WebPlatform extends ClientPlatform {}
