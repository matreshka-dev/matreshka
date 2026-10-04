import { DOCUMENT, inject, InjectionToken, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { PlatformId } from '@shared/enums/platform-id';
import {
  AppBackMessage,
  AppNavigateMessage,
  AppReconnectInfoMessage,
  AppReloadMessage,
  AppStorageValueMessage,
  HandshakeMessage as BffHandshakeMessage,
} from '@shared/messages/bff-to-client/app';
import type { PlatformSetColorSchemeMode } from '@shared/messages/bff-to-client/platforms/platform-set-color-scheme-message';
import { PlatformSetColorSchemeMessage } from '@shared/messages/bff-to-client/platforms/platform-set-color-scheme-message';
import { PlatformSetOverlaysMessage } from '@shared/messages/bff-to-client/platforms/platform-set-overlays-message';
import { PlatformShowNativePickerMessage } from '@shared/messages/bff-to-client/platforms/platform-show-native-picker-message';
import { AppClientStateMessage } from '@shared/messages/client-to-bff/app';
import { ClientState } from '@shared/types/client-state';
import { take } from 'rxjs';
import { ServerComponent } from '../components/server/server-component';
import type {
  Overlay,
  ServerComponentConfig,
} from '../components/server/server-component-config';
import { ComponentHubService } from '../services/component-hub.service';
import { ContextHubService } from '../services/context-hub.service';
import { FontRegistryService } from '../services/font-registry.service';
import { PostmanService } from '../services/postman.service';
import { WINDOW } from '../tokens/window';
import { applyFontsToDocument } from '../utils/app-fonts';
import {
  applyColorSchemePreference,
  applyStoredColorSchemePreference,
  getStoredPrefersColorScheme,
} from '../utils/apply-color-scheme-preference';
import { parseContextPath } from '../utils/parse-context-path';
import { registerColors } from '../utils/register-colors';
import { syncConfigColorsToElement } from '../utils/sync-config-colors-to-element';
import { stringIsExternalUrl } from '../utils/string-is-external-url';

export const PLATFORM = new InjectionToken<Platform>('');

export abstract class Platform {
  abstract storage: any; // TODO убрать any
  window = inject(WINDOW);
  document = inject(DOCUMENT);
  postman = inject(PostmanService);
  protected componentHub = inject(ComponentHubService);
  private readonly contextHub = inject(ContextHubService);
  private readonly fontRegistry = inject(FontRegistryService);
  private readonly nativePickerInputs = new Map<string, HTMLInputElement>();

  /** Конфиги платформенных оверлеев (вне страницы, переживают навигацию). */
  readonly platformOverlays = signal<Overlay[]>([]);
  private readonly defaultColorClasses = new Set<string>();
  serverInstanceId?: string;
  router = inject(Router);
  abstract id(): PlatformId; // Уникальный идентификатор платформы для распознавания на сервере

  /** Класс платформы на `body` для CSS, в т.ч. скрытие scrollbar (см. `_platform-scroll.scss`). */
  protected applyPlatformBodyClass(): void {
    this.document.body.classList.add(this.id());
  }

  async boot(): Promise<this> {
    this.applyPlatformBodyClass();
    applyStoredColorSchemePreference(this.document);
    this.postman.incomingMessage$.subscribe((message) => {
      if (message instanceof AppReconnectInfoMessage) {
        if (this.serverInstanceId !== message.payload.serverInstanceId) {
          this.window.location.reload();
        }
        return;
      }
      if (message instanceof BffHandshakeMessage) {
        const payload = message.payload;
        if (!this.serverInstanceId) {
          this.serverInstanceId = payload.serverInstanceId;
        } else if (this.serverInstanceId !== payload.serverInstanceId) {
          this.window.location.reload();
        }
        registerColors(payload.settings.colors.registry);
        syncConfigColorsToElement(
          this.document,
          this.document.documentElement,
          payload.settings.colors.default,
          this.defaultColorClasses,
        );
        this.fontRegistry.setConfig(payload.settings.fonts);
        applyFontsToDocument(this.document, payload.settings.fonts);
        if (payload.settings.analytics?.yandex) {
          const counterId = payload.settings.analytics.yandex.id;
          const scriptTag = document.createElement('script');
          scriptTag.setAttribute('type', 'text/javascript');
          scriptTag.textContent = `(function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${counterId}', 'ym');
  
    ym(${counterId}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});`;
          this.document.getElementsByTagName('head')[0].appendChild(scriptTag);
        }
        return;
      }
      if (message instanceof AppReloadMessage) {
        this.window.location.reload();
        return;
      }
      if (message instanceof AppNavigateMessage) {
        const external = stringIsExternalUrl(message.payload.path);
        if (!external) {
          this.router.navigateByUrl(message.payload.path);
        } else {
          this.openExternalLink(message.payload.path);
        }
        return;
      }
      if (message instanceof AppBackMessage) {
        this.window.history.back();
        return;
      }
      if (message instanceof PlatformSetOverlaysMessage) {
        this.applyPlatformOverlays(message.payload.overlays as Overlay[]);
        return;
      }
      if (message instanceof PlatformShowNativePickerMessage) {
        this.showNativePicker(message.payload);
        return;
      }
      if (message instanceof PlatformSetColorSchemeMessage) {
        applyColorSchemePreference(this.document, message.payload.mode, true);
        this.onColorSchemePreferenceApplied(message.payload.mode);
        return;
      }
      if (message instanceof AppStorageValueMessage) {
        this.storage.setItem(message.payload.key, message.payload.value);
        return;
      }
    });
    this.router.events.subscribe(async (event) => {
      if (event instanceof NavigationStart) {
        this.componentHub.destroyActivePageEntry();
        await this.syncClientState(
          new URL(this.window.location.origin + event.url),
        );
      }
    });
    return this;
  } // Загрузка платформы - например загрузка SDK из интернета
  abstract payload(): Record<string, unknown>; // Данные платформы, которые должен знать сервер
  abstract language(): Promise<string>; //  https://datatracker.ietf.org/doc/html/rfc5646

  applicationId(): Promise<string> {
    return Promise.resolve(this.window.location.host);
  }

  async generateClientState(url: URL): Promise<ClientState> {
    return {
      route: {
        visitedAt: Date.now(),
        path: url.pathname,
        query: Object.fromEntries(new URLSearchParams(url.search) as any),
      },
      storage: this.storageValues(),
      language: await this.language(),
      userAgent: this.window.navigator.userAgent,
      prefersColorScheme: getStoredPrefersColorScheme() ?? 'system',
      platform: {
        id: this.id(),
        payload: this.payload(),
      },
    };
  }

  async syncClientState(url: URL) {
    const state = await this.generateClientState(url);
    return this.postman.outcomingMessage$.next(
      new AppClientStateMessage(state),
    );
  }

  protected onColorSchemePreferenceApplied(
    _mode: PlatformSetColorSchemeMode,
  ): void {}

  abstract storageValues(): Record<string, string>;

  abstract openExternalLink(url: string): void;

  private applyPlatformOverlays(next: Overlay[]) {
    const prev = this.platformOverlays();
    for (const o of prev) {
      this.componentHub.deleteConfig(o.component);
    }
    for (const o of next) {
      this.componentHub.registerConfig(o.component);
    }
    this.platformOverlays.set(next);
  }

  private showNativePicker(
    payload: PlatformShowNativePickerMessage['payload'],
  ): void {
    const { contextId } = parseContextPath(payload.ref);
    this.contextHub
      .init$(contextId)
      .pipe(take(1))
      .subscribe(() => {
        this.openNativePicker(payload);
      });
  }

  private openNativePicker(
    payload: PlatformShowNativePickerMessage['payload'],
  ): void {
    const instances = this.componentHub.getInstancesByComponentId(
      payload.component_id,
    );
    for (const instance of instances) {
      this.openNativePickerForInstance(payload, instance);
    }
  }

  private openNativePickerForInstance(
    payload: PlatformShowNativePickerMessage['payload'],
    instance: ServerComponent<ServerComponentConfig>,
  ): void {
    const anchorElement = this.getNativePickerAnchorElement(instance);
    if (!anchorElement) {
      return;
    }

    const instanceId = instance.id();
    this.cleanupNativePickerInput(instanceId);

    const input = this.document.createElement('input');
    input.type = payload.inputType;
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    input.style.opacity = '0';
    input.style.position = 'absolute';
    input.style.top = '0';
    input.style.left = '0';
    input.style.width = '0';
    input.style.height = '100%';
    input.style.zIndex = '2';
    input.style.setProperty('border-radius', '0');

    const currentValue = this.contextHub.value(payload.ref);
    const pickerValue = this.toNativePickerValue(
      payload.inputType,
      currentValue,
    );
    if (pickerValue) {
      input.value = pickerValue;
    }

    input.addEventListener('change', () => {
      const { contextId, key } = parseContextPath(payload.ref);
      this.contextHub.setValues(contextId, [
        {
          key,
          value: this.toContextValue(payload.inputType, input.value),
        },
      ]);
      this.cleanupNativePickerInput(instanceId);
    });
    input.addEventListener('blur', () => {
      this.window.setTimeout(() => {
        this.cleanupNativePickerInput(instanceId);
      });
    });

    anchorElement.append(input);
    this.nativePickerInputs.set(instanceId, input);
    input.focus({ preventScroll: true });

    const pickerInput = input as HTMLInputElement & {
      showPicker?: () => void;
    };
    if (typeof pickerInput.showPicker === 'function') {
      try {
        pickerInput.showPicker();
        return;
      } catch {
        // В некоторых браузерах showPicker может не работать, тогда используем click.
      }
    }

    input.click();
  }

  private getNativePickerAnchorElement(
    instance: ServerComponent<ServerComponentConfig>,
  ): HTMLElement | null {
    let anchorElement = instance.elementRef.nativeElement as HTMLElement;
    if (
      this.window
        .getComputedStyle(anchorElement)
        .getPropertyValue('display') === 'contents'
    ) {
      const firstChild = anchorElement.firstElementChild;
      if (firstChild instanceof HTMLElement) {
        anchorElement = firstChild;
      }
    }

    return anchorElement;
  }

  private cleanupNativePickerInput(componentId: string): void {
    this.nativePickerInputs.get(componentId)?.remove();
    this.nativePickerInputs.delete(componentId);
  }

  private toNativePickerValue(
    inputType: PlatformShowNativePickerMessage['payload']['inputType'],
    value: unknown,
  ): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }

    switch (inputType) {
      case 'color':
        return typeof value === 'string' ? value : '';
      case 'date':
        return this.formatDateValue(value);
      case 'time':
        return typeof value === 'string' ? value : '';
      case 'datetime-local':
        return this.formatDatetimeValue(value);
    }
  }

  private toContextValue(
    inputType: PlatformShowNativePickerMessage['payload']['inputType'],
    value: string,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    switch (inputType) {
      case 'color':
        return value;
      case 'date':
        return new Date(value).toLocaleDateString('en-US', {
          timeZone: 'UTC',
        });
      case 'time':
        return value;
      case 'datetime-local':
        return new Date(value).toISOString();
    }
  }

  private formatDateValue(value: unknown): string {
    const date = new Date(value as string | number | Date);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatDatetimeValue(value: unknown): string {
    const date = new Date(value as string | number | Date);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
}
