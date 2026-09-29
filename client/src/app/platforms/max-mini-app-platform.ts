import { PlatformId } from '@shared/enums/platform-id';
import { DisablePrivacyModeMessage } from '@shared/messages/bff-to-client/platforms/disable-privacy-mode-message';
import { EnablePrivacyModeMessage } from '@shared/messages/bff-to-client/platforms/enable-privacy-mode-message';
import { MaxMiniAppRequestContactMessage } from '@shared/messages/bff-to-client/platforms/max-mini-app/max-mini-app-request-contact-message';
import { MaxMiniAppRequestContactActionSuccessMessage } from '@shared/messages/client-to-bff/platforms/max-mini-app/max-mini-app-request-contact-action-success-message';
import { loadScript } from '../utils/load-script';
import { BrowserStorage } from './shared/browser-storage';
import { WebPlatform } from './web-platform';

let webApp: any;

export class MaxMiniAppPlatform extends WebPlatform {
  storage = new BrowserStorage();
  id(): PlatformId {
    return PlatformId.WebMaxMiniApp;
  }

  language(): Promise<string> {
    return Promise.resolve(this.window.navigator.language);
  }

  payload(): Record<string, unknown> {
    // webApp.initData доступна только в момент первой загрузки страницы, при перезагрузке она не подставляется
    return this.storage.getItem('max_init_data');
  }

  override async boot(): Promise<this> {
    await super.boot();
    this.postman.incomingMessage$.subscribe((message) => {
      if (message instanceof EnablePrivacyModeMessage) {
        this.enablePrivacyMode();
        return;
      }
      if (message instanceof DisablePrivacyModeMessage) {
        this.disablePrivacyMode();
        return;
      }
      if (message instanceof MaxMiniAppRequestContactMessage) {
        this.requestContact(message);
        return;
      }
    });
    await this.storage.boot();
    await loadScript(this.document, 'https://st.max.ru/js/max-web-app.js');
    webApp = (this.window as any).WebApp;
    if (webApp.initData.includes('auth_date=')) {
      // При перезагрузке в хэше есть только параметр hash=...
      this.storage.setItem('max_init_data', webApp.initData);
    }
    return this;
  }

  requestContact(message: MaxMiniAppRequestContactMessage) {
    webApp.requestContact().then((response: { phone: string }) => {
      this.postman.outcomingMessage$.next(
        new MaxMiniAppRequestContactActionSuccessMessage(
          message.target,
          response,
        ),
      );
    });
  }

  override storageValues(): Record<string, string> {
    return this.storage.values();
  }

  override openExternalLink(url: string) {
    webApp.openLink(url);
  }
}
