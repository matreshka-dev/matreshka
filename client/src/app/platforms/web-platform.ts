import { ClientPlatform } from './client-platform';

export abstract class WebPlatform extends ClientPlatform {
  private privacyMode = false;
  constructor() {
    super();
  }

  override async boot(): Promise<this> {
    await super.boot();
    this.window.onfocus = () => {
      if (this.privacyMode) {
        this.disableWindowBlur();
      }
    };
    this.window.onblur = () => {
      if (this.privacyMode) {
        this.enableWindowBlur();
      }
    };
    return this;
  }

  enablePrivacyMode() {
    this.privacyMode = true;
    if (!this.document.hasFocus()) {
      // На случай если в момент включения режима окно не находится в фокусе
      this.enableWindowBlur();
    }
  }
  disablePrivacyMode() {
    this.privacyMode = false;
    // Нужно всегда отключать блюр
    this.disableWindowBlur();
  }

  private enableWindowBlur() {
    this.document.body.classList.add('privacy-mode');
  }

  private disableWindowBlur() {
    this.document.body.classList.remove('privacy-mode');
  }
}
