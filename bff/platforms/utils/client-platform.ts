import { PlatformId } from "@matreshka/shared/enums/platform-id";
import { Client, currentClient } from "../../core";
import { AndroidPlatform } from "../android-platform";
import { BrowserPlatform } from "../browser-platform";
import { IosPlatform } from "../ios-platform";
import { MaxMiniAppPlatform } from "../max-mini-app-platform";
import { Platform } from "../platform";
import { PwaPlatform } from "../pwa-platform";
import { ServerPlatform } from "../server-platform";
import { TelegramMiniAppPlatform } from "../telegram-mini-app-platform";

const CACHE: WeakMap<Client, Platform> = new WeakMap();

export function currentClientPlatform(): Platform {
  return clientPlatform(currentClient());
}

export function clientPlatform(client: Client): Platform {
  if (!CACHE.has(client)) {
    const platforms: Partial<
      Record<PlatformId, new (client: Client) => Platform>
    > = {
      [PlatformId.Android]: AndroidPlatform,
      [PlatformId.Ios]: IosPlatform,
      [PlatformId.WebPwa]: PwaPlatform,
      [PlatformId.WebTelegramMiniApp]: TelegramMiniAppPlatform,
      [PlatformId.WebMaxMiniApp]: MaxMiniAppPlatform,
      [PlatformId.WebBrowser]: BrowserPlatform, // Fallback, всегда должна быть последней из настоящих
      [PlatformId.Server]: ServerPlatform,
    };

    const platformId = client.state$.getValue().platform.id;
    const PlatformClass = platforms[platformId];
    if (!PlatformClass) {
      throw new Error("Unknown client platform");
    }
    const instance = new PlatformClass(client);
    CACHE.set(client, instance);
  }
  return CACHE.get(client) as Platform;
}
