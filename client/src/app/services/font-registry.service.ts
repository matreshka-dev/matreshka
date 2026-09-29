import { Injectable, signal } from '@angular/core';
import { AppFontsConfig, type FontStackToken } from '@shared/types/fonts';
import {
  buildFontFamilyValue,
  buildFontStackCssProperties,
  type FontStackCssProperties,
} from '../utils/app-fonts';

@Injectable({
  providedIn: 'root',
})
export class FontRegistryService {
  readonly config = signal<AppFontsConfig | undefined>(undefined);

  setConfig(config: AppFontsConfig): void {
    this.config.set(config);
  }

  fontFamily(stack: FontStackToken | undefined): string | undefined {
    const config = this.config();
    if (!config || !stack) {
      return undefined;
    }

    return buildFontFamilyValue(stack, config);
  }

  fontStyles(stack: FontStackToken | undefined): FontStackCssProperties {
    const config = this.config();
    if (!config || !stack) {
      return {};
    }

    return buildFontStackCssProperties(stack, config);
  }
}
